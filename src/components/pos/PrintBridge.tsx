'use client';

import * as React from "react";
import { useEffect, useState } from "react";
import { createBrowserClient } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { generateInvoicePDF, InvoiceData } from "@/lib/pdf/invoice.template";
import { markAsPrinted, markAsFailed } from "@/lib/actions/print";
import { Printer, AlertTriangle, CheckCircle, RefreshCcw } from "lucide-react";
import * as Sentry from '@sentry/nextjs';

interface PrintJob {
  id: string;
  device_id: string;
  content: InvoiceData;
  status: 'PENDING' | 'PRINTED' | 'FAILED';
  created_at: string;
  claimed_at?: string | null;
  printed_at?: string | null;
}

export function PrintBridge() {
  const [deviceId, setDeviceId] = useState<string>("");
  const [status, setStatus] = useState<'CONNECTING' | 'ONLINE' | 'OFFLINE'>('CONNECTING');
  const [jobs, setJobs] = useState<PrintJob[]>([]);
  const [printedCount, setPrintedCount] = useState(0);

  useEffect(() => {
    let id = localStorage.getItem('bridge_device_id');
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem('bridge_device_id', id);
    }
    setDeviceId(id);

    const supabase = createBrowserClient();

    const fetchPending = async () => {
      const { data } = await supabase
        .from('print_queue')
        .select('*')
        .eq('device_id', id)
        .eq('status', 'PENDING')
        .order('created_at', { ascending: true });
        
      if (data && data.length > 0) {
        processQueue(data);
      }
    };

    fetchPending();

    const channel = supabase.channel('print_queue_channel')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'print_queue',
        filter: `device_id=eq.${id}`
      }, (payload: { new: PrintJob }) => {
        if (payload.new.status === 'PENDING') {
          processQueue([payload.new]);
        }
      })
      .subscribe((statusStr: string) => {
        if (statusStr === 'SUBSCRIBED') setStatus('ONLINE');
        else if (statusStr === 'CLOSED' || statusStr === 'CHANNEL_ERROR') setStatus('OFFLINE');
      });

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchPending();
        if (channel.state !== 'joined') channel.subscribe();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      supabase.removeChannel(channel);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  const processQueue = async (newJobs: PrintJob[]) => {
    for (const job of newJobs) {
      setJobs((prev: PrintJob[]) => [job, ...prev].slice(0, 5)); // Keep last 5
      
      try {
        const supabase = createBrowserClient();
        await supabase.from('print_queue').update({ claimed_at: new Date().toISOString() } as Record<string, any>).eq('id', job.id);

        const pdf = await generateInvoicePDF(job.content);
        pdf.autoPrint();
        const blobUrl = pdf.output('bloburl');

        // Crear iframe oculto para imprimir
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = blobUrl.toString();
        
        iframe.onload = () => {
          setTimeout(() => {
            if (iframe.contentWindow) {
              iframe.contentWindow.print();
              markAsPrinted({ queue_id: job.id });
              setPrintedCount(c => c + 1);
            }
          }, 500);
        };

        document.body.appendChild(iframe);
        
      } catch (err) {
        Sentry.captureException(err, {
          extra: { jobId: job.id, invoice: job.content?.invoice_number }
        });
        await markAsFailed({ queue_id: job.id });
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Printer className="h-6 w-6" />
                Terminal de Impresión (PC Bridge)
              </CardTitle>
              <CardDescription>Manten esta ventana abierta para recibir e imprimir facturas en tiempo real.</CardDescription>
            </div>
            <Badge variant={status === 'ONLINE' ? 'default' : status === 'OFFLINE' ? 'destructive' : 'secondary'} className="text-sm px-3 py-1">
              {status === 'ONLINE' ? 'En Línea' : status === 'OFFLINE' ? 'Desconectado' : 'Conectando...'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-slate-50 p-4 rounded-md border flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Device ID</p>
              <p className="font-mono text-sm">{deviceId || 'Cargando...'}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 font-medium">Facturas Impresas</p>
              <p className="text-2xl font-bold text-blue-600">{printedCount}</p>
            </div>
          </div>

          {status === 'OFFLINE' && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Conexión perdida</AlertTitle>
              <AlertDescription className="flex items-center justify-between">
                <span>No se recibirán nuevas facturas.</span>
                <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                  <RefreshCcw className="mr-2 h-3 w-3" /> Reconectar
                </Button>
              </AlertDescription>
            </Alert>
          )}

          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-3 uppercase tracking-wider">Últimos Trabajos</h3>
            <div className="space-y-2">
              {jobs.map((job: PrintJob) => (
                <div key={job.id} className="flex items-center justify-between p-3 border rounded-md text-sm">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="font-medium">{job.content?.invoice_number || 'Factura'}</span>
                    <span className="text-gray-500">{new Date(job.created_at).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}
              {jobs.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4 border rounded-md border-dashed">
                  Esperando trabajos de impresión...
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import { jsPDF } from "jspdf";
import dinero from "dinero.js";
import { getBusinessConfig } from '@/lib/queries/config';

export interface InvoiceData {
  invoice_number: string;
  created_at: string;
  client_name: string | null;
  client_nit: string | null;
  vendedor: string;
  items: Array<{
    name: string;
    quantity: number;
    unit_price: string;
    discount_pct: number;
    subtotal: string; // no lo calculamos de nuevo si ya viene, o lo usamos por dinero
  }>;
  subtotal: string;
  tax_amount: string;
  total: string;
  notes: string | null;
}

export async function generateInvoicePDF(data: InvoiceData): Promise<jsPDF> {
  // Ticket de 80mm de ancho. El largo es variable según la cantidad de items.
  const baseHeight = 120;
  const itemHeight = 10;
  const totalHeight = baseHeight + (data.items.length * itemHeight);

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [80, totalHeight]
  });

  // Obtener configuración dinámica del negocio
  const config = await getBusinessConfig();
  const businessName = config?.business_name || 'MI NEGOCIO';
  const businessNit = config?.nit || 'NIT: 000000000-0';
  const businessAddress = config?.address || 'Dirección de ejemplo';
  const businessPhone = config?.phone || 'Tel: 0000000';
  const businessEmail = config?.email || '';
  const businessMessage = config?.message || 'Gracias por su compra!';

  let y = 10;
  const centerX = 40;

  // Header
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(businessName, centerX, y, { align: "center" });
  
  y += 5;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(businessNit, centerX, y, { align: "center" });
  y += 4;
  doc.text(businessAddress, centerX, y, { align: "center" });
  if (businessEmail) {
    y += 4;
    doc.text(businessEmail, centerX, y, { align: "center" });
  }
  y += 4;
  doc.text(businessPhone, centerX, y, { align: "center" });

  y += 5;
  doc.setLineWidth(0.5);
  doc.line(5, y, 75, y); // Separator

  // Info Factura
  y += 6;
  doc.setFont("helvetica", "bold");
  doc.text(`Factura: ${data.invoice_number}`, 5, y);
  y += 4;
  doc.setFont("helvetica", "normal");
  const dateStr = new Date(data.created_at).toLocaleString();
  doc.text(`Fecha: ${dateStr}`, 5, y);
  y += 4;
  doc.text(`Vendedor: ${data.vendedor}`, 5, y);

  if (data.client_name) {
    y += 4;
    doc.text(`Cliente: ${data.client_name}`, 5, y);
    if (data.client_nit) {
      y += 4;
      doc.text(`NIT: ${data.client_nit}`, 5, y);
    }
  }

  y += 5;
  doc.line(5, y, 75, y); // Separator

  // Items
  y += 6;
  doc.setFont("helvetica", "bold");
  doc.text("Cant", 5, y);
  doc.text("Producto", 15, y);
  doc.text("Subtotal", 55, y);

  doc.setFont("helvetica", "normal");
  y += 2;
  
  for (const item of data.items) {
    y += 5;
    doc.text(item.quantity.toString(), 5, y);
    
    // Truncar nombre a 20 chars
    let name = item.name;
    if (name.length > 20) name = name.substring(0, 20) + '...';
    doc.text(name, 15, y);

    // Formatear valor
    const amount = dinero({ amount: Math.round(Number(item.subtotal) * 100), currency: 'USD' }).toFormat('$0,0.00');
    doc.text(amount, 75, y, { align: "right" });
    
    if (item.discount_pct > 0) {
      y += 4;
      doc.setFontSize(8);
      doc.text(`  (Desc. ${item.discount_pct}%)`, 15, y);
      doc.setFontSize(9);
    }
  }

  y += 5;
  doc.line(5, y, 75, y); // Separator

  // Totales
  y += 6;
  const formattedSubtotal = dinero({ amount: Math.round(Number(data.subtotal) * 100), currency: 'USD' }).toFormat('$0,0.00');
  const formattedTax = dinero({ amount: Math.round(Number(data.tax_amount) * 100), currency: 'USD' }).toFormat('$0,0.00');
  const formattedTotal = dinero({ amount: Math.round(Number(data.total) * 100), currency: 'USD' }).toFormat('$0,0.00');

  doc.text("Subtotal:", 35, y);
  doc.text(formattedSubtotal, 75, y, { align: "right" });
  
  y += 5;
  doc.text("IVA:", 35, y);
  doc.text(formattedTax, 75, y, { align: "right" });
  
  y += 6;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("TOTAL:", 35, y);
  doc.text(formattedTotal, 75, y, { align: "right" });

  y += 8;
  doc.line(5, y, 75, y); // Separator

  // Footer
  y += 8;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Gracias por su compra!", centerX, y, { align: "center" });

  // QR Code Mock (en un caso real, se genera data URL con QRCode.toDataURL)
  // const qrDataUrl = await QRCode.toDataURL(data.invoice_number);
  // doc.addImage(qrDataUrl, 'PNG', 25, y + 5, 30, 30);
  y += 10;
  doc.text("[ Código QR aquí ]", centerX, y + 10, { align: "center" });

  return doc;
}

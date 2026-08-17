/**
 * Construye el XML UBL 2.1 para una Factura o Boleta electrónica (SUNAT Perú).
 * El XML resultante debe ser firmado digitalmente antes de enviarse a SUNAT u OSE.
 */

export interface UblInvoiceParams {
  invoiceId: string;
  issueDate: string;
  dueDate?: string;
  invoiceTypeCode: '01' | '03';
  documentCurrencyCode: 'PEN';
  supplierRuc: string;
  supplierName: string;
  customerDocType: '6' | '1';
  customerDoc: string;
  customerName: string;
  subTotal: number;
  igv: number;
  total: number;
  lines: UblInvoiceLine[];
}

export interface UblInvoiceLine {
  lineNumber: number;
  quantity: number;
  unitCode: string;
  description: string;
  unitPrice: number;
  lineExtensionAmount: number;
  taxAmount: number;
}

export function buildUblInvoiceXml(p: UblInvoiceParams): string {
  const escXml = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const lines = p.lines
    .map((l) =>
      `    <cac:InvoiceLine>
      <cbc:ID>${l.lineNumber}</cbc:ID>
      <cbc:InvoicedQuantity unitCode="${escXml(l.unitCode)}">${l.quantity}</cbc:InvoicedQuantity>
      <cbc:LineExtensionAmount currencyID="${p.documentCurrencyCode}">${l.lineExtensionAmount.toFixed(2)}</cbc:LineExtensionAmount>
      <cac:TaxTotal>
        <cbc:TaxAmount currencyID="${p.documentCurrencyCode}">${l.taxAmount.toFixed(2)}</cbc:TaxAmount>
        <cac:TaxSubtotal>
          <cbc:TaxableAmount currencyID="${p.documentCurrencyCode}">${l.lineExtensionAmount.toFixed(2)}</cbc:TaxableAmount>
          <cbc:TaxAmount currencyID="${p.documentCurrencyCode}">${l.taxAmount.toFixed(2)}</cbc:TaxAmount>
          <cac:TaxCategory>
            <cbc:ID schemeID="UN/ECE 5305" schemeName="Tax Category Identifier" schemeAgencyName="United Nations Economic Commission for Europe">S</cbc:ID>
            <cac:TaxScheme>
              <cbc:ID>1000</cbc:ID>
              <cbc:Name>IGV</cbc:Name>
              <cbc:TaxTypeCode>VAT</cbc:TaxTypeCode>
            </cac:TaxScheme>
          </cac:TaxCategory>
        </cac:TaxSubtotal>
      </cac:TaxTotal>
      <cac:Item>
        <cbc:Description>${escXml(l.description)}</cbc:Description>
      </cac:Item>
      <cac:Price>
        <cbc:PriceAmount currencyID="${p.documentCurrencyCode}">${l.unitPrice.toFixed(2)}</cbc:PriceAmount>
      </cac:Price>
    </cac:InvoiceLine>`,
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
         xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2">
  <ext:UBLExtensions>
    <ext:UBLExtension>
      <ext:ExtensionContent><!-- Firma digital irá aquí (SignedInfo, SignatureValue, KeyInfo) --></ext:ExtensionContent>
    </ext:UBLExtension>
  </ext:UBLExtensions>
  <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
  <cbc:CustomizationID>2.0</cbc:CustomizationID>
  <cbc:ID>${escXml(p.invoiceId)}</cbc:ID>
  <cbc:IssueDate>${p.issueDate}</cbc:IssueDate>${p.dueDate ? `\n  <cbc:DueDate>${p.dueDate}</cbc:DueDate>` : ''}
  <cbc:InvoiceTypeCode listID="0101">${p.invoiceTypeCode}</cbc:InvoiceTypeCode>
  <cbc:Note languageLocaleID="1000"><![CDATA[${p.total.toFixed(2)} SOLES]]></cbc:Note>
  <cbc:DocumentCurrencyCode>${p.documentCurrencyCode}</cbc:DocumentCurrencyCode>
  <cbc:LineCountNumeric>${p.lines.length}</cbc:LineCountNumeric>
  <cac:Signature>
    <cbc:ID>${escXml(p.supplierRuc)}</cbc:ID>
    <cac:SignatoryParty>
      <cac:PartyIdentification><cbc:ID>${escXml(p.supplierRuc)}</cbc:ID></cac:PartyIdentification>
      <cac:PartyName><cbc:Name>${escXml(p.supplierName)}</cbc:Name></cac:PartyName>
    </cac:SignatoryParty>
    <cac:DigitalSignatureAttachment>
      <cac:ExternalReference><cbc:URI>#SignatureSP</cbc:URI></cac:ExternalReference>
    </cac:DigitalSignatureAttachment>
  </cac:Signature>
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID schemeID="6">${escXml(p.supplierRuc)}</cbc:ID>
      </cac:PartyIdentification>
      <cac:PartyName><cbc:Name>${escXml(p.supplierName)}</cbc:Name></cac:PartyName>
      <cac:PartyLegalEntity><cbc:RegistrationName>${escXml(p.supplierName)}</cbc:RegistrationName></cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingSupplierParty>
  <cac:AccountingCustomerParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID schemeID="${p.customerDocType}">${escXml(p.customerDoc)}</cbc:ID>
      </cac:PartyIdentification>
      <cac:PartyLegalEntity><cbc:RegistrationName>${escXml(p.customerName)}</cbc:RegistrationName></cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingCustomerParty>
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="${p.documentCurrencyCode}">${p.igv.toFixed(2)}</cbc:TaxAmount>
    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="${p.documentCurrencyCode}">${p.subTotal.toFixed(2)}</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="${p.documentCurrencyCode}">${p.igv.toFixed(2)}</cbc:TaxAmount>
      <cac:TaxCategory>
        <cbc:ID schemeID="UN/ECE 5305" schemeName="Tax Category Identifier" schemeAgencyName="United Nations Economic Commission for Europe">S</cbc:ID>
        <cac:TaxScheme>
          <cbc:ID>1000</cbc:ID>
          <cbc:Name>IGV</cbc:Name>
          <cbc:TaxTypeCode>VAT</cbc:TaxTypeCode>
        </cac:TaxScheme>
      </cac:TaxCategory>
    </cac:TaxSubtotal>
  </cac:TaxTotal>
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="${p.documentCurrencyCode}">${p.subTotal.toFixed(2)}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="${p.documentCurrencyCode}">${p.subTotal.toFixed(2)}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="${p.documentCurrencyCode}">${p.total.toFixed(2)}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="${p.documentCurrencyCode}">${p.total.toFixed(2)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
${lines}
</Invoice>`;
}

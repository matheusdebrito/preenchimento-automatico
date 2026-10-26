import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { catalog } from '../dist/modules/catalog/catalog.js';
import { fillPdf } from '../dist/modules/pdf/fill-pdf.js';

const root = resolve(process.cwd(), '..');
const synthetic = {
  'person.fullName': 'MARIA TESTE',
  'person.address': 'RUA EXEMPLO',
  'person.cpf': '000.000.000-00',
  'person.streetNumber': '100',
  'person.apartment': 'APT 2',
  'person.city': 'NITEROI',
  'person.state': 'RJ',
  'person.identity': '1234567',
  'person.issuer': 'DETRAN',
  'person.postalCode': '24000-000',
  'person.phone': '2190000000',
  'person.mobile': '21990000000',
  'person.neighborhood': 'CENTRO',
  'person.email': 'teste@example.invalid',
  'person.issueDate': '01/01/2020',
  'person.nationality': 'BRASILEIRA',
  'person.birthplace': 'NITEROI',
  'person.placeDate': 'NITEROI, 26/10/2026',
  'vessel.name': 'MA TESTE',
  'vessel.registration': '1234567890',
  'vessel.hullId': 'BR-ABC-12345',
  'vessel.length': '3,10 M',
  'vessel.year': '2020',
  'vessel.capacity': '2',
  'vessel.motorBrand': 'TESTE',
  'vessel.motorPower': '90 HP',
  'vessel.motorSerial': 'MTR123456',
  'seller.fullName': 'JOAO TESTE',
  'seller.cpf': '111.111.111-11',
  'seller.identity': '1234567',
  'seller.issuer': 'DETRAN',
  'seller.phone': '2199000000',
  'seller.email': 'vendedor@example.invalid',
  'seller.address': 'RUA TESTE',
  'seller.streetNumber': '50',
  'seller.neighborhood': 'CENTRO',
  'seller.city': 'NITEROI',
  'seller.state': 'RJ',
  'seller.postalCode': '24000-000',
  'sale.invoice': 'NF 100',
  'sale.date': '26/10/2026',
  'sale.place': 'RJ',
  'sale.price': 'R$ 1000,00',
};
for (const map of catalog.mappings) {
  const v = catalog.versions.find((version) => version.id === map.formVersionId);
  if (!v?.templatePath) throw new Error('Template missing: '+map.formVersionId);
  const input = await readFile(resolve(root,v.templatePath));
  const output = await fillPdf(input,map.placements,synthetic);
  const pdf = await PDFDocument.load(output);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  for (const page of pdf.getPages()) {
    page.drawText('AMOSTRA - DADOS FICTICIOS - NAO UTILIZAR', {
      x: 72, y: page.getHeight()-30, size: 7.5, font, color: rgb(0.75,0.1,0.1),
    });
  }
  const dir = join(root,'docs/_pdf_test_previews',v.formId);
  await mkdir(dir,{recursive:true});
  const path = join(dir,'synthetic.pdf');
  await writeFile(path, await pdf.save({useObjectStreams:false}));
  console.log('Synthetic sample created: '+v.formId+' / '+map.placements.length+' placements');
}

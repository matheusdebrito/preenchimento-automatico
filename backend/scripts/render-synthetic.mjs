import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { catalog } from '../dist/modules/catalog/catalog.js';
import { fillPdf } from '../dist/modules/pdf/fill-pdf.js';
import { validateMappedFieldValues } from '../dist/modules/catalog/field-validation.js';

// All test data below is synthetic; only visual previews are committed.
const root = resolve(process.cwd(), '..');
const synthetic = {
  'declarant.fullName': 'MARIA GONÇALVES',
  'declarant.identity': 'RG1234567',
  'declarant.cpf': '123.456.789-09',
  'declarant.nationality': 'BRASILEIRA',
  'declarant.birthplace': 'NITEROI',
  'declarant.issueDate': '01/01/2020',
  'declarant.phone': '2190000000',
  'declarant.mobile': '21990000000',
  'declarant.email': 'teste@example.invalid',
  'vessel.authority': 'CAPITANIA DE TESTE',
  'vessel.builderName': 'ESTALEIRO TESTE',
  'seller.identityType': 'RG',
  'seller.issueDate': '01/01/2020',
  'seller.apartment': 'CASA',
  'coOwner.fullName': 'ANA CONCEIÇÃO',
  'coOwner.cpf': '123.456.789-09',
  'coOwner.phone': '2190000000',
  'coOwner.email': 'coproprietaria@example.invalid',
  'process.transferOwnership': 'X',
  'seller.nationality': 'BRASILEIRO',
  'seller.birthplace': 'RJ',
  'person.fullName': 'MARIA GONÇALVES',
  'person.address': 'RUA SÃO JOSÉ',
  'person.cpf': '123.456.789-09',
  'person.streetNumber': '100',
  'person.apartment': 'APT 2',
  'person.city': 'NITERÓI',
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
  'person.placeDate': 'NITERÓI, 26/10/2026',
  'vessel.name': 'MARÉ TESTE',
  'vessel.registration': '1234567890',
  'vessel.hullId': 'BR-ABC-12345',
  'vessel.length': '3,10 M',
  'vessel.year': '2020',
  'vessel.capacity': '2',
  'vessel.motorBrand': 'TESTE',
  'vessel.motorPower': '90 HP',
  'vessel.motorSerial': 'MTR123456',
  'seller.fullName': 'JOÃO TESTE',
  'seller.cpf': '529.982.247-25',
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
  'sale.place': 'SÃO LUÍS',
  'sale.price': 'R$ 1000,00',
  'process.vesselAction': 'transf_prop',
  'process.inscription': 'false',
  'process.transferProperty': 'true',
  'process.transferJurisdiction': 'false',
  'process.updateVesselData': 'false',
  'process.otherServiceDescription': '2ª VIA DO TIE/TIEM',
  'process.notes': 'AMOSTRA DE PREENCHIMENTO',
  'process.place': 'NITEROI',
  'process.date': '29/10/2026',
  'process.requestAuthority': 'CAPITANIA DOS PORTOS DE TESTE',
  'process.requestSubject': 'TRANSFERÊNCIA DE JURISDIÇÃO',
  'process.requestPurpose': 'a transferência da minha jurisdição de aquaviário para a CP/DL/AG destinatária.',
  'person.fullAddress': 'RUA SÃO JOSÉ, 100, CENTRO, NITERÓI/RJ, 24000-000',
  'process.lostTie': 'true',
  'process.amateurRequest': 'emissao_renovacao',
  'process.chaLossReason': 'extraviada',
  'process.motonautaRequest': 'renovacao_agregacao_mta',
  // Synthetic mapping values are semantic PDF values, after service answer conversion.
  'process.motonautaDeclaration': 'true',
  'amateur.chaNumber': 'CHA123456',
  'amateur.chaIssueDate': '01/01/2025',
  'amateur.category': 'ARRAIS-AMADOR',
  'person.birthDate': '22/11/1999',
  'person.fax': '2130000000',
  'coOwner.identity': 'RG7654321',
  'coOwner.issuer': 'DETRAN',
  'coOwner.state': 'RJ',
  'coOwner.address': 'RUA TESTE 2',
  'coOwner.postalCode': '24000-001',
  'coOwner.neighborhood': 'CENTRO',
  'coOwner.city': 'NITEROI',
  'coOwner.nationality': 'BRASILEIRA',
  'coOwner.fax': '2130000001',
  'vessel.type': 'LANCHA',
  'vessel.netTonnage': '2,10',
  'vessel.depth': '1,20',
  'vessel.hullMaterial': 'FIBRA',
  'vessel.contour': 'NORMAL',
  'vessel.navigationArea': 'INTERIOR',
  'vessel.propulsionType': 'MOTOR',
  'vessel.classification': 'ESPORTE E RECREIO',
  'vessel.imoNumber': 'IMO1234567',
  'vessel.callSign': 'PPTESTE',
  'vessel.tmRegistration': 'TM12345',
  'vessel.keelDate': '01/02/2020',
  'vessel.launchDate': '01/06/2020',
  'vessel.motorCount': '1',
  'vessel.totalPropulsionPowerKw': '66,2',
  'vessel.tonnage69': 'true',
  'vessel.tonnageMethod': 'depois_t69',
  'vessel.lateralThrusterBow': '1',
  'vessel.lateralThrusterMidship': '0',
  'vessel.lateralThrusterStern': '1',
  'vessel.fuelType1': 'DIESEL',
  'vessel.fuelType2': 'GASOLINA',
  'vessel.fuelCapacity1': '500 L',
  'vessel.fuelCapacity2': '100 L',
  'vessel.constructionLicense': 'LC-12345',
  'vessel.staticTraction': '12',
  'vessel.superstructureMaterial': 'FIBRA',
  'vessel.classificationSociety': 'ENTIDADE TESTE',
  'vessel.mortgaged': 'nao',
  'vessel.helideck': 'nao',
  'vessel.equipmentGps': 'true',
  'vessel.equipmentRadar': 'true',
  'vessel.equipmentEchoSounder': 'true',
  'vessel.equipmentAis': 'true',
  'vessel.communicationHf': 'true',
  'vessel.communicationUhf': 'false',
  'vessel.communicationVhfNoDsc': 'true',
  'vessel.communicationVhfDsc': 'false',
  'vessel.communicationGmdss': 'true',
  'vessel.inmarsatA': 'A-TESTE',
  'vessel.inmarsatB': 'B-TESTE',
  'vessel.inmarsatC': 'C-TESTE',
  'vessel.dpemNumber': 'DPEM-12345',
  'vessel.dpemExpiry': '31/12/2027',
};
// Only fictitious data is ever used in published CI samples.
async function writePreview(input, placements, values, path) {
  validateMappedFieldValues(catalog.fields, placements, values);
  const output = await fillPdf(input, placements, values);
  const pdf = await PDFDocument.load(output);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  for (const page of pdf.getPages()) {
    page.drawText('AMOSTRA - DADOS FICTICIOS - NAO UTILIZAR', {
      x: 72, y: page.getHeight() - 30, size: 7.5,
      font, color: rgb(0.75, 0.1, 0.1),
    });
  }
  await writeFile(path, await pdf.save({ useObjectStreams: false }));
}

for (const map of catalog.mappings) {
  const version = catalog.versions.find((item) => item.id === map.formVersionId);
  if (!version?.templatePath) throw new Error('Template missing: ' + map.formVersionId);
  const input = await readFile(resolve(root, version.templatePath));
  const dir = join(root, 'docs/_pdf_test_previews', version.formId);
  await mkdir(dir, { recursive: true });
  await writePreview(input, map.placements, synthetic, join(dir, 'synthetic.pdf'));

  // Exercise visually reviewed, physically separate second-line writing areas.
  const stressValues = version.formId === 'bade-er'
    ? { ...synthetic, 'person.fullName': 'MARIA GONCALVES DE ANDRADE',
      'coOwner.fullName': 'ANA PAULA DE CARVALHO' }
    : version.formId === 'declaracao-residencia-ma'
      ? { ...synthetic,
        'person.address': 'AVENIDA DOS NAVEGANTES DO PORTO COMERCIAL E TURISTICO' }
      : null;
  if (stressValues) {
    await writePreview(input, map.placements, stressValues, join(dir, 'synthetic-long.pdf'));
  }
  console.log('Synthetic samples created: ' + version.formId + ' / ' +
    map.placements.length + ' placements' + (stressValues ? ' + long values' : ''));
}

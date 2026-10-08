import test from 'node:test'
import assert from 'node:assert/strict'
import { filterResources, MAX_FILE_BYTES, normalizeResource, resourceFileType, validateResourceFile } from '../src/resourceUtils.js'
import { attendanceSummary } from '../src/attendanceUtils.js'
import { officialGuides } from '../src/officialGuides.js'

test('uploads reject missing, empty, unsupported and oversized files', () => {
  for (const file of [null, {name:'notes.pdf',size:0}, {name:'run.exe',size:5}, {name:'notes.pdf',size:MAX_FILE_BYTES+1}]) assert.ok(validateResourceFile(file))
})
test('supported uploads accept uppercase extensions and the size boundary', () => {
  for (const name of ['notes.PDF','slides.pptx','work.docx']) assert.equal(validateResourceFile({name,size:MAX_FILE_BYTES}), '')
  assert.equal(resourceFileType({name:'notes.PDF'}).mime, 'application/pdf')
})
const items=[
  {id:'1',title:'Data Structures',description:'Trees and graphs',department:'CSE',course:'CSE 2201',category:'Notes',uploaded_by:'a',visibility:'Public',tags:['trees']},
  {id:'2',title:'Database',description:'SQL joins',department:'CSE',course:'CSE 311',category:'Question Paper',uploaded_by:'b',visibility:'Private',tags:['sql']},
  {id:'3',title:'Physics',department:'EEE',category:'Notes',uploaded_by:'a',visibility:'Private',tags:[]},
]
test('keyword search matches all words across metadata and ignores case', () => {
  assert.deepEqual(filterResources(items,{query:' CSE   TREES '}).map(item=>item.id),['1'])
  assert.equal(filterResources(items,{query:'trees sql'}).length,0)
})
test('department, category and tag filters combine', () => {
  assert.deepEqual(filterResources(items,{department:'CSE',category:'Question Paper',tag:'sql'}).map(item=>item.id),['2'])
})
test('private scope shows only the current uploader’s private records', () => {
  assert.deepEqual(filterResources(items,{scope:'private',userId:'a'}).map(item=>item.id),['3'])
})
test('mine, public and saved scopes work', () => {
  assert.equal(filterResources(items,{scope:'mine',userId:'a'}).length,2)
  assert.equal(filterResources(items,{scope:'public'}).length,1)
  assert.deepEqual(filterResources(items,{scope:'saved',saved:['1']}).map(item=>item.id),['1'])
})
test('resource normalization handles missing tags and invalid dates', () => {
  const item=normalizeResource({created_at:'invalid',file_type:'PDF',category:'Notes'})
  assert.deepEqual(item.tags,[]); assert.equal(item.date,''); assert.equal(item.type,'PDF')
})
test('attendance counts recorded Present/Late and excludes Excused/unmarked', () => {
  assert.deepEqual(attendanceSummary(['Present','Absent','Late','Excused',''].map(status=>({status}))),{attended:2,total:3,percentage:67})
})
test('no recorded classes means no invented percentage', () => {
  assert.equal(attendanceSummary([]).percentage,null)
  assert.equal(attendanceSummary([{status:'Excused'}]).percentage,null)
})
test('official guides have unique questions, valid categories and official sources', () => {
  assert.equal(new Set(officialGuides.map(item=>item.question)).size,officialGuides.length)
  for(const item of officialGuides){assert.equal(new URL(item.source_url).hostname,'www.cityuniversity.ac.bd');assert.ok(['bus','exam','rules','academic','general'].includes(item.category));assert.ok(item.answer.trim());assert.ok(item.keywords.length)}
})

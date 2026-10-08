import { supabase } from './supabaseClient.js'
import { campusError } from './campusData.js'

export async function withDocument(values,userId,save,previous={}) {
  const fields={...values};delete fields.attachment
  const file=values.attachment
  if(file?.name && file.size===0)throw new Error('The selected attachment is empty. Choose another file.')
  let path
  if(file?.size){
    const types={pdf:'application/pdf',docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',pptx:'application/vnd.openxmlformats-officedocument.presentationml.presentation',jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',webp:'image/webp'}
    const extension=file.name.split('.').pop().toLowerCase()
    if(!types[extension]||file.size>20*1024*1024)throw new Error('Use a PDF, DOCX, PPTX, JPG, PNG or WebP file up to 20 MB.')
    path=`${userId}/${crypto.randomUUID()}.${extension}`
    const{error}=await supabase.storage.from('campus-documents').upload(path,file,{contentType:types[extension],upsert:false});if(error)throw error
    fields.attachment_path=path;fields.attachment_name=file.name
  }else{fields.attachment_path=previous.attachment_path||null;fields.attachment_name=previous.attachment_name||null}
  try{return await save(fields)}catch(error){if(path){const{error:cleanup}=await supabase.storage.from('campus-documents').remove([path]);if(cleanup)throw new Error(`${campusError(error)} Attachment cleanup failed; contact an administrator.`)}throw error}
}

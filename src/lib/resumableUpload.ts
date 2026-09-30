// Envio retomável (TUS) para o Supabase Storage: necessário para ficheiros grandes.
// Envia em partes de 6 MB; se a ligação falhar, retoma de onde parou.
import { Upload } from 'tus-js-client'
import { supabase } from './supabase'

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.replace(/\/+$/, '')

export async function uploadResumable(
  bucket: string,
  path: string,
  file: Blob,
  contentType: string,
  onProgress?: (fraction: number) => void,
): Promise<void> {
  if (!supabase || !SUPABASE_URL) throw new Error('Supabase não configurado')
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new Error('Sessão expirada — entre de novo no admin.')

  await new Promise<void>((resolve, reject) => {
    const upload = new Upload(file, {
      endpoint: `${SUPABASE_URL}/storage/v1/upload/resumable`,
      retryDelays: [0, 3000, 5000, 10000, 20000],
      headers: { authorization: `Bearer ${token}`, 'x-upsert': 'true' }, // mesma tentativa pode repetir o caminho
      uploadDataDuringCreation: false, // 1.º pedido sem dados: mais compatível com redes/proxies
      removeFingerprintOnSuccess: true,
      chunkSize: 6 * 1024 * 1024, // o Supabase exige exactamente 6 MB por parte
      metadata: { bucketName: bucket, objectName: path, contentType, cacheControl: '31536000' },
      onError: (e) => reject(e),
      onProgress: (sent, total) => onProgress?.(total ? sent / total : 0),
      onSuccess: () => resolve(),
    })
    // retoma um envio anterior do mesmo ficheiro, se existir
    upload.findPreviousUploads().then((prev) => {
      if (prev.length) upload.resumeFromPreviousUpload(prev[0])
      upload.start()
    })
  })
}

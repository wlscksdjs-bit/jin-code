'use server'

import { auth } from '@/lib/auth'
import { getDriveClient } from '@/lib/google'

const PMS_FOLDER_ID = process.env.GOOGLE_DRIVE_PMS_FOLDER_ID

export async function listFiles(folderId?: string) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  const drive = await getDriveClient()

  const query = folderId
    ? `'${folderId}' in parents and trashed = false`
    : `'root' in parents and trashed = false`

  const response = await drive.files.list({
    q: query,
    fields: 'files(id, name, mimeType, size, createdTime, modifiedTime, webViewLink)',
    orderBy: 'modifiedTime desc',
  })

  return response.data.files || []
}

export async function uploadFile(
  name: string,
  mimeType: string,
  content: Buffer | Uint8Array,
  parentFolderId?: string
) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  const drive = await getDriveClient()

  const metadata = {
    name,
    parents: parentFolderId ? [parentFolderId] : undefined,
  }

  const response = await drive.files.create({
    requestBody: metadata,
    media: {
      mimeType,
      body: Buffer.from(content),
    },
    fields: 'id, name, webViewLink',
  })

  return {
    fileId: response.data.id,
    name: response.data.name,
    webViewLink: response.data.webViewLink,
  }
}

export async function createFolder(name: string, parentFolderId?: string) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  const drive = await getDriveClient()

  const metadata = {
    name,
    mimeType: 'application/vnd.google-apps.folder',
    parents: parentFolderId ? [parentFolderId] : undefined,
  }

  const response = await drive.files.create({
    requestBody: metadata,
    fields: 'id, name, webViewLink',
  })

  return {
    folderId: response.data.id,
    name: response.data.name,
    webViewLink: response.data.webViewLink,
  }
}

export async function deleteFile(fileId: string) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  const drive = await getDriveClient()

  await drive.files.delete({ fileId })

  return { success: true }
}

export async function uploadToPmsFolder(
  name: string,
  mimeType: string,
  content: Buffer | Uint8Array
) {
  return uploadFile(name, mimeType, content, PMS_FOLDER_ID)
}

export async function shareFile(fileId: string, email: string, role: 'reader' | 'writer' = 'reader') {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  const drive = await getDriveClient()

  await drive.permissions.create({
    fileId,
    requestBody: {
      type: 'user',
      role,
      emailAddress: email,
    },
  })

  return { success: true }
}

'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { CreateDocumentSchema, UpdateDocumentSchema } from '@/lib/schemas'

export async function createDocument(formData: FormData) {
  const rawData = Object.fromEntries(formData.entries())
  const validated = CreateDocumentSchema.safeParse(rawData)
  
  if (!validated.success) {
    throw new Error(validated.error.issues.map(e => e.message).join(', '))
  }
  
  await prisma.document.create({
    data: {
      projectId: validated.data.projectId,
      title: validated.data.title,
      type: validated.data.type,
      fileName: validated.data.fileName || null,
      fileUrl: validated.data.fileUrl || null,
      fileSize: validated.data.fileSize || null,
      mimeType: validated.data.mimeType || null,
      version: validated.data.version || '1.0',
      description: validated.data.description || null,
    },
  })

  revalidatePath(`/projects/${validated.data.projectId}`)
}

export async function updateDocument(id: string, projectId: string, formData: FormData) {
  const rawData = Object.fromEntries(formData.entries())
  const validated = UpdateDocumentSchema.safeParse({ ...rawData, id })
  
  if (!validated.success) {
    throw new Error(validated.error.issues.map(e => e.message).join(', '))
  }
  
  await prisma.document.update({
    where: { id },
    data: {
      title: validated.data.title,
      type: validated.data.type,
      fileName: validated.data.fileName || null,
      fileUrl: validated.data.fileUrl || null,
      fileSize: validated.data.fileSize || null,
      mimeType: validated.data.mimeType || null,
      version: validated.data.version || '1.0',
      description: validated.data.description || null,
    },
  })

  revalidatePath(`/projects/${projectId}`)
}

export async function deleteDocument(id: string, projectId: string) {
  await prisma.document.delete({
    where: { id },
  })

  revalidatePath(`/projects/${projectId}`)
}

'use server'

import { auth } from '@/lib/auth'
import { getSheetsClient } from '@/lib/google'

export async function readSheet(spreadsheetId: string, range: string) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  const sheets = await getSheetsClient()
  
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  })

  return {
    values: response.data.values || [],
    range: response.data.range,
    majorDimension: response.data.majorDimension,
  }
}

export async function writeSheet(
  spreadsheetId: string,
  range: string,
  values: (string | number | null)[][]
) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  const sheets = await getSheetsClient()

  const response = await sheets.spreadsheets.values.update({
    spreadsheetId,
    range,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values },
  })

  return {
    updatedCells: response.data.updatedCells,
    updatedRange: response.data.updatedRange,
    updatedRows: response.data.updatedRows,
    updatedColumns: response.data.updatedColumns,
  }
}

export async function appendSheet(
  spreadsheetId: string,
  range: string,
  values: (string | number | null)[][]
) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  const sheets = await getSheetsClient()

  const response = await sheets.spreadsheets.values.append({
    spreadsheetId,
    range,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values },
  })

  return {
    spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
    tableRange: response.data.tableRange,
    updates: response.data.updates,
  }
}

export async function createSpreadsheet(title: string) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  const sheets = await getSheetsClient()

  const spreadsheet = await sheets.spreadsheets.create({
    requestBody: {
      properties: {
        title,
        locale: 'ko_KR',
        timeZone: 'Asia/Seoul',
      },
    },
  })

  return {
    spreadsheetId: spreadsheet.data.spreadsheetId,
    spreadsheetUrl: spreadsheet.data.spreadsheetUrl,
    title: spreadsheet.data.properties?.title,
  }
}



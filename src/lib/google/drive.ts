import { google } from 'googleapis'
import { createOAuth2ClientWithTokens, GoogleTokens, refreshTokenIfNeeded } from '../googleAuth'

export interface LessonPlanData {
  topic: string
  grade: string
  subject: string
  duration: string
  content: string
}

export interface DriveUploadResult {
  fileId: string
  fileName: string
  webViewLink: string
}

export class GoogleDriveService {
  private oauth2Client
  private drive

  constructor(tokens: GoogleTokens) {
    this.oauth2Client = createOAuth2ClientWithTokens(tokens)
    this.drive = google.drive({ version: 'v3', auth: this.oauth2Client })
  }

  async ensureLessonPlansFolder(): Promise<string> {
    try {
      // Search for existing "Lesson Plans" folder
      const response = await this.drive.files.list({
        q: "name='Lesson Plans' and mimeType='application/vnd.google-apps.folder' and trashed=false",
        spaces: 'drive'
      })

      if (response.data.files && response.data.files.length > 0) {
        return response.data.files[0].id!
      }

      // Create the folder if it doesn't exist
      const folderResponse = await this.drive.files.create({
        requestBody: {
          name: 'Lesson Plans',
          mimeType: 'application/vnd.google-apps.folder'
        }
      })

      return folderResponse.data.id!
    } catch (error) {
      console.error('Error managing Lesson Plans folder:', error)
      throw new Error('Failed to create or access Lesson Plans folder')
    }
  }

  generateFileName(lessonData: LessonPlanData, extension: string): string {
    const date = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
    const cleanTopic = lessonData.topic.replace(/[^a-zA-Z0-9\s]/g, '').trim()
    return `Peabody ${lessonData.grade} ${lessonData.subject} - ${cleanTopic} - ${date}.${extension}`
  }

  async uploadFile(
    fileName: string,
    content: Buffer,
    mimeType: string,
    parentFolderId?: string
  ): Promise<DriveUploadResult> {
    try {
      const requestBody: any = {
        name: fileName
      }

      if (parentFolderId) {
        requestBody.parents = [parentFolderId]
      }

      // Convert buffer to stream for googleapis
      const Readable = require('stream').Readable
      const stream = new Readable()
      stream.push(content)
      stream.push(null)
      
      const response = await this.drive.files.create({
        requestBody,
        media: {
          mimeType,
          body: stream
        }
      })

      const fileId = response.data.id!
      
      // Get the web view link
      const fileInfo = await this.drive.files.get({
        fileId,
        fields: 'webViewLink'
      })

      return {
        fileId,
        fileName,
        webViewLink: fileInfo.data.webViewLink!
      }
    } catch (error) {
      console.error('Error uploading file to Drive:', error)
      throw new Error(`Failed to upload ${fileName} to Google Drive: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async uploadLessonPlan(
    lessonData: LessonPlanData,
    fileContent: Buffer,
    fileType: 'pdf' | 'docx'
  ): Promise<DriveUploadResult> {
    const folderId = await this.ensureLessonPlansFolder()
    const fileName = this.generateFileName(lessonData, fileType)
    const mimeType = fileType === 'pdf' 
      ? 'application/pdf' 
      : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

    return this.uploadFile(fileName, fileContent, mimeType, folderId)
  }
}

export async function createDriveService(tokens: GoogleTokens): Promise<GoogleDriveService> {
  try {
    // Check if tokens need refresh
    let validTokens = tokens
    if (tokens.expiry_date && tokens.expiry_date < Date.now()) {
      validTokens = await refreshTokenIfNeeded(tokens)
    }
    
    return new GoogleDriveService(validTokens)
  } catch (error) {
    console.error('Error creating Drive service:', error)
    throw new Error('Failed to initialize Google Drive service')
  }
}
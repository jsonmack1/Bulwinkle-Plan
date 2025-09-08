// Memory Bank Storage and Management
// Handles automatic lesson saving and retrieval with Supabase database

import { ActivityNode } from '../types/memoryBank'
import { supabase } from './supabase'

export interface VideoData {
  id: string
  title: string
  description?: string
  url?: string
}

interface DifferentiationData {
  type: string
  level: string
  modifications: string[]
}

interface LessonSaveData {
  title: string
  subject: string
  gradeLevel: string
  topic: string
  activityType: string
  duration: number
  content: string
  selectedVideos?: VideoData[]
  differentiationApplied?: DifferentiationData
  userEmail?: string
  userId?: string
}

// Memory Bank Storage Service - Now using Supabase Database
export class MemoryBankService {
  // Remove localStorage dependency completely
  
  // Save a lesson to the database memory bank
  static async saveLesson(lessonData: LessonSaveData): Promise<string> {
    try {
      console.log('💾 Saving lesson to database:', lessonData.title)
      
      // Insert lesson into database
      const { data: lesson, error: lessonError } = await supabase
        .from('lessons')
        .insert({
          title: lessonData.title || `${lessonData.subject} - ${lessonData.topic}`,
          subject: lessonData.subject,
          grade_level: lessonData.gradeLevel,
          topic: lessonData.topic,
          activity_type: lessonData.activityType,
          duration: lessonData.duration,
          content: lessonData.content,
          user_id: lessonData.userId,
          user_email: lessonData.userEmail,
          preview_text: MemoryBankService.generatePreview(lessonData.content),
          tags: MemoryBankService.generateTags(lessonData),
          mode: 'teacher',
          rating: 0,
          use_count: 1,
          is_favorite: false,
          template_use_count: 0,
          success_score: 0
        })
        .select()
        .single()
      
      if (lessonError) {
        console.error('❌ Failed to save lesson:', lessonError)
        throw new Error(`Database error: ${lessonError.message}`)
      }

      const lessonId = lesson.id
      console.log('✅ Lesson saved to database with ID:', lessonId)
      
      // Save associated videos if any
      if (lessonData.selectedVideos && lessonData.selectedVideos.length > 0) {
        await MemoryBankService.saveLessonVideos(lessonId, lessonData.selectedVideos)
      }
      
      // Save differentiation data if any
      if (lessonData.differentiationApplied) {
        await MemoryBankService.saveLessonDifferentiation(lessonId, lessonData.differentiationApplied)
      }
      
      return lessonId
      
    } catch (error) {
      console.error('❌ Failed to save lesson to Memory Bank:', error)
      throw new Error('Failed to save lesson')
    }
  }
  
  // Get all lessons from database
  static async getAllLessons(): Promise<ActivityNode[]> {
    try {
      const { data: lessons, error } = await supabase
        .from('lessons')
        .select(`
          *,
          lesson_videos(
            youtube_video_id,
            title,
            thumbnail_url,
            duration_seconds
          ),
          lesson_differentiations(*)
        `)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('❌ Failed to retrieve lessons:', error)
        return []
      }
      
      // Convert database format to ActivityNode format
      return lessons?.map(lesson => MemoryBankService.convertToActivityNode(lesson)) || []
    } catch (error) {
      console.error('❌ Failed to retrieve lessons from Memory Bank:', error)
      return []
    }
  }
  
  // Get lessons for specific user
  static async getLessonsForUser(userId?: string, userEmail?: string): Promise<ActivityNode[]> {
    try {
      let query = supabase
        .from('lessons')
        .select(`
          *,
          lesson_videos(
            youtube_video_id,
            title,
            thumbnail_url,
            duration_seconds
          ),
          lesson_differentiations(*)
        `)
        .order('created_at', { ascending: false })
      
      // Filter by user ID or email
      if (userId) {
        query = query.eq('user_id', userId)
      } else if (userEmail) {
        query = query.eq('user_email', userEmail)
      } else {
        // No user specified, return empty
        return []
      }
      
      const { data: lessons, error } = await query
      
      if (error) {
        console.error('❌ Failed to retrieve user lessons:', error)
        return []
      }
      
      return lessons?.map(lesson => MemoryBankService.convertToActivityNode(lesson)) || []
    } catch (error) {
      console.error('❌ Failed to retrieve lessons for user:', error)
      return []
    }
  }
  
  // Update lesson usage in database
  static async updateLessonUsage(lessonId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('lessons')
        .update({ 
          use_count: supabase.raw('use_count + 1'),
          last_used: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', lessonId)
      
      if (error) {
        console.error('❌ Failed to update lesson usage:', error)
      } else {
        console.log('✅ Updated lesson usage for:', lessonId)
      }
    } catch (error) {
      console.error('❌ Failed to update lesson usage:', error)
    }
  }
  
  // Delete lesson from database
  static async deleteLesson(lessonId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('lessons')
        .delete()
        .eq('id', lessonId)
      
      if (error) {
        console.error('❌ Failed to delete lesson:', error)
      } else {
        console.log('✅ Deleted lesson from Memory Bank:', lessonId)
      }
    } catch (error) {
      console.error('❌ Failed to delete lesson:', error)
    }
  }
  
  // Toggle favorite status in database
  static async toggleFavorite(lessonId: string): Promise<void> {
    try {
      // First get current status
      const { data: lesson, error: fetchError } = await supabase
        .from('lessons')
        .select('is_favorite, title')
        .eq('id', lessonId)
        .single()
      
      if (fetchError) {
        console.error('❌ Failed to fetch lesson for favorite toggle:', fetchError)
        return
      }
      
      // Toggle the status
      const { error: updateError } = await supabase
        .from('lessons')
        .update({ 
          is_favorite: !lesson.is_favorite,
          updated_at: new Date().toISOString()
        })
        .eq('id', lessonId)
      
      if (updateError) {
        console.error('❌ Failed to toggle favorite:', updateError)
      } else {
        console.log('✅ Toggled favorite status:', lesson.title)
      }
    } catch (error) {
      console.error('❌ Failed to toggle favorite:', error)
    }
  }
  
  // Helper: Generate preview text from content
  private static generatePreview(content: string): string {
    if (!content) return 'No preview available'
    
    // Remove markdown formatting and get first meaningful sentence
    const cleanContent = content
      .replace(/#{1,6}\s/g, '') // Remove headers
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
      .replace(/\*(.*?)\*/g, '$1') // Remove italic
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links
      .replace(/\n+/g, ' ') // Replace newlines with spaces
      .trim()
    
    // Get first 150 characters
    const preview = cleanContent.substring(0, 150)
    return preview.length < cleanContent.length ? preview + '...' : preview
  }
  
  // Helper: Generate tags from lesson data
  // Helper methods for database operations
  
  // Save lesson videos to database
  private static async saveLessonVideos(lessonId: string, videos: VideoData[]): Promise<void> {
    try {
      const videoInserts = videos.map(video => ({
        lesson_id: lessonId,
        youtube_video_id: video.id,
        title: video.title,
        description: video.description,
        thumbnail_url: video.url
      }))
      
      const { error } = await supabase
        .from('lesson_videos')
        .insert(videoInserts)
      
      if (error) {
        console.error('❌ Failed to save lesson videos:', error)
      } else {
        console.log('✅ Saved lesson videos:', videos.length)
      }
    } catch (error) {
      console.error('❌ Failed to save lesson videos:', error)
    }
  }
  
  // Save lesson differentiation to database
  private static async saveLessonDifferentiation(lessonId: string, differentiation: DifferentiationData): Promise<void> {
    try {
      const { error } = await supabase
        .from('lesson_differentiations')
        .insert({
          lesson_id: lessonId,
          differentiation_type: differentiation.type,
          level: differentiation.level,
          modifications: differentiation.modifications
        })
      
      if (error) {
        console.error('❌ Failed to save lesson differentiation:', error)
      } else {
        console.log('✅ Saved lesson differentiation')
      }
    } catch (error) {
      console.error('❌ Failed to save lesson differentiation:', error)
    }
  }
  
  // Convert database lesson to ActivityNode format
  private static convertToActivityNode(lesson: any): ActivityNode {
    return {
      id: lesson.id,
      title: lesson.title,
      subject: lesson.subject,
      gradeLevel: lesson.grade_level,
      topic: lesson.topic,
      activityType: lesson.activity_type,
      duration: lesson.duration,
      rating: lesson.rating || 0,
      useCount: lesson.use_count || 1,
      createdAt: lesson.created_at,
      lastUsed: lesson.last_used || lesson.created_at,
      preview: lesson.preview_text || MemoryBankService.generatePreview(lesson.content),
      tags: lesson.tags || [],
      isFavorite: lesson.is_favorite || false,
      mode: lesson.mode || 'teacher',
      fullContent: lesson.content,
      templateUseCount: lesson.template_use_count || 0,
      successScore: lesson.success_score || 0,
      userEmail: lesson.user_email,
      selectedVideos: lesson.lesson_videos?.map((video: any) => ({
        id: video.youtube_video_id,
        title: video.title,
        url: video.thumbnail_url
      })) || [],
      differentiationApplied: lesson.lesson_differentiations?.length > 0 ? {
        type: lesson.lesson_differentiations[0].differentiation_type,
        level: lesson.lesson_differentiations[0].level,
        modifications: lesson.lesson_differentiations[0].modifications
      } : undefined
    }
  }
  
  private static generateTags(lessonData: LessonSaveData): string[] {
    const tags: string[] = []
    
    // Add subject and activity type
    tags.push(lessonData.subject)
    tags.push(lessonData.activityType)
    
    // Add grade level category
    const gradeNum = parseInt(lessonData.gradeLevel.match(/\d+/)?.[0] || '0')
    if (gradeNum <= 5) tags.push('Elementary')
    else if (gradeNum <= 8) tags.push('Middle School')
    else tags.push('High School')
    
    // Add duration category
    if (lessonData.duration <= 30) tags.push('Quick Activity')
    else if (lessonData.duration <= 60) tags.push('Standard Lesson')
    else tags.push('Extended Activity')
    
    // Add video tag if videos are included
    if (lessonData.selectedVideos && lessonData.selectedVideos.length > 0) {
      tags.push('With Videos')
    }
    
    // Add differentiation tag if applied
    if (lessonData.differentiationApplied) {
      tags.push('Differentiated')
    }
    
    return tags
  }
  
  // Get storage statistics from database
  static async getStorageStats(userId?: string): Promise<{ totalLessons: number, totalSizeMB: number }> {
    try {
      let query = supabase.from('lessons').select('id', { count: 'exact', head: true })
      
      if (userId) {
        query = query.eq('user_id', userId)
      }
      
      const { count, error } = await query
      
      if (error) {
        console.error('❌ Failed to get storage stats:', error)
        return { totalLessons: 0, totalSizeMB: 0 }
      }
      
      return {
        totalLessons: count || 0,
        totalSizeMB: 0 // Database storage doesn't need size calculation
      }
    } catch (error) {
      return { totalLessons: 0, totalSizeMB: 0 }
    }
  }
}

// Hook for easy access to memory bank in components (now async)
export function useMemoryBank() {
  return {
    saveLesson: MemoryBankService.saveLesson,
    getAllLessons: MemoryBankService.getAllLessons,
    getLessonsForUser: MemoryBankService.getLessonsForUser,
    updateLessonUsage: MemoryBankService.updateLessonUsage,
    deleteLesson: MemoryBankService.deleteLesson,
    toggleFavorite: MemoryBankService.toggleFavorite,
    getStorageStats: MemoryBankService.getStorageStats
  }
}
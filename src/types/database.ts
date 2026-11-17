
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "announcement_reads": {
                  Row: {
                    "announcement_id": string,"read_at": string | null,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "announcement_id": string,"read_at"?: string | null,"user_id": string
                  }
                  Update: {
                    "announcement_id"?: string,"read_at"?: string | null,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "announcement_reads_announcement_id_fkey"
      columns: ["announcement_id"]
isOneToOne: false
      referencedRelation: "announcements"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "announcement_reads_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"announcements": {
                  Row: {
                    "author_id": string,"batch_id": string | null,"content": string,"created_at": string | null,"id": string,"institute_id": string,"priority": string | null,"title": string,"updated_at": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "author_id": string,"batch_id"?: string | null,"content": string,"created_at"?: string | null,"id"?: string,"institute_id": string,"priority"?: string | null,"title": string,"updated_at"?: string | null
                  }
                  Update: {
                    "author_id"?: string,"batch_id"?: string | null,"content"?: string,"created_at"?: string | null,"id"?: string,"institute_id"?: string,"priority"?: string | null,"title"?: string,"updated_at"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "announcements_author_id_fkey"
      columns: ["author_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "announcements_batch_id_fkey"
      columns: ["batch_id"]
isOneToOne: false
      referencedRelation: "batches"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "announcements_institute_id_fkey"
      columns: ["institute_id"]
isOneToOne: false
      referencedRelation: "institutes"
      referencedColumns: ["id"]
    }
                  ]
                },"assignment_answer_keys": {
                  Row: {
                    "answer_keys": NonNullable<Json>,"assignment_id": string,"created_at": string | null,"institute_id": string,"updated_at": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "answer_keys"?: NonNullable<Json>,"assignment_id": string,"created_at"?: string | null,"institute_id": string,"updated_at"?: string | null
                  }
                  Update: {
                    "answer_keys"?: NonNullable<Json>,"assignment_id"?: string,"created_at"?: string | null,"institute_id"?: string,"updated_at"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "assignment_answer_keys_assignment_id_fkey"
      columns: ["assignment_id"]
isOneToOne: true
      referencedRelation: "assignments"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "assignment_answer_keys_institute_id_fkey"
      columns: ["institute_id"]
isOneToOne: false
      referencedRelation: "institutes"
      referencedColumns: ["id"]
    }
                  ]
                },"assignments": {
                  Row: {
                    "allow_resubmission": boolean | null,"attachment_url": string | null,"batch_id": string,"close_at": string | null,"created_at": string | null,"created_by": string | null,"description": string | null,"due_date": string,"duration_minutes": number | null,"file_url": string | null,"homework_type": string | null,"id": string,"institute_id": string,"instructions": string | null,"max_attempts": number | null,"max_marks": number | null,"open_at": string | null,"question_count": number | null,"questions": Json | null,"subject": string | null,"subject_id": string | null,"teacher_id": string | null,"title": string,"total_marks": number | null,"type": Database["public"]['Enums']["assignment_type_enum"]
                  }
                  ComputedFields: never
                  Insert: {
                    "allow_resubmission"?: boolean | null,"attachment_url"?: string | null,"batch_id": string,"close_at"?: string | null,"created_at"?: string | null,"created_by"?: string | null,"description"?: string | null,"due_date": string,"duration_minutes"?: number | null,"file_url"?: string | null,"homework_type"?: string | null,"id"?: string,"institute_id": string,"instructions"?: string | null,"max_attempts"?: number | null,"max_marks"?: number | null,"open_at"?: string | null,"question_count"?: number | null,"questions"?: Json | null,"subject"?: string | null,"subject_id"?: string | null,"teacher_id"?: string | null,"title": string,"total_marks"?: number | null,"type"?: Database["public"]['Enums']["assignment_type_enum"]
                  }
                  Update: {
                    "allow_resubmission"?: boolean | null,"attachment_url"?: string | null,"batch_id"?: string,"close_at"?: string | null,"created_at"?: string | null,"created_by"?: string | null,"description"?: string | null,"due_date"?: string,"duration_minutes"?: number | null,"file_url"?: string | null,"homework_type"?: string | null,"id"?: string,"institute_id"?: string,"instructions"?: string | null,"max_attempts"?: number | null,"max_marks"?: number | null,"open_at"?: string | null,"question_count"?: number | null,"questions"?: Json | null,"subject"?: string | null,"subject_id"?: string | null,"teacher_id"?: string | null,"title"?: string,"total_marks"?: number | null,"type"?: Database["public"]['Enums']["assignment_type_enum"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "assignments_batch_id_fkey"
      columns: ["batch_id"]
isOneToOne: false
      referencedRelation: "batches"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "assignments_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "assignments_institute_id_fkey"
      columns: ["institute_id"]
isOneToOne: false
      referencedRelation: "institutes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "assignments_subject_id_fkey"
      columns: ["subject_id"]
isOneToOne: false
      referencedRelation: "subjects"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "assignments_teacher_id_fkey"
      columns: ["teacher_id"]
isOneToOne: false
      referencedRelation: "teachers"
      referencedColumns: ["id"]
    }
                  ]
                },"attendance": {
                  Row: {
                    "batch_id": string,"created_at": string | null,"date": string,"id": string,"institute_id": string,"marked_by": string | null,"remarks": string | null,"status": string,"student_id": string,"updated_at": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "batch_id": string,"created_at"?: string | null,"date"?: string,"id"?: string,"institute_id": string,"marked_by"?: string | null,"remarks"?: string | null,"status": string,"student_id": string,"updated_at"?: string | null
                  }
                  Update: {
                    "batch_id"?: string,"created_at"?: string | null,"date"?: string,"id"?: string,"institute_id"?: string,"marked_by"?: string | null,"remarks"?: string | null,"status"?: string,"student_id"?: string,"updated_at"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "attendance_batch_id_fkey"
      columns: ["batch_id"]
isOneToOne: false
      referencedRelation: "batches"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "attendance_institute_id_fkey"
      columns: ["institute_id"]
isOneToOne: false
      referencedRelation: "institutes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "attendance_marked_by_fkey"
      columns: ["marked_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "attendance_student_id_fkey"
      columns: ["student_id"]
isOneToOne: false
      referencedRelation: "students"
      referencedColumns: ["id"]
    }
                  ]
                },"attendance_audit_log": {
                  Row: {
                    "attendance_id": string | null,"batch_id": string,"changed_at": string | null,"changed_by": string,"id": string,"new_status": string,"previous_status": string,"reason": string,"student_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "attendance_id"?: string | null,"batch_id": string,"changed_at"?: string | null,"changed_by": string,"id"?: string,"new_status": string,"previous_status": string,"reason": string,"student_id": string
                  }
                  Update: {
                    "attendance_id"?: string | null,"batch_id"?: string,"changed_at"?: string | null,"changed_by"?: string,"id"?: string,"new_status"?: string,"previous_status"?: string,"reason"?: string,"student_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "attendance_audit_log_attendance_id_fkey"
      columns: ["attendance_id"]
isOneToOne: false
      referencedRelation: "attendance"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "attendance_audit_log_batch_id_fkey"
      columns: ["batch_id"]
isOneToOne: false
      referencedRelation: "batches"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "attendance_audit_log_changed_by_fkey"
      columns: ["changed_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "attendance_audit_log_student_id_fkey"
      columns: ["student_id"]
isOneToOne: false
      referencedRelation: "students"
      referencedColumns: ["id"]
    }
                  ]
                },"batch_schedule": {
                  Row: {
                    "batch_id": string,"created_at": string | null,"end_time": string,"id": string,"institute_id": string,"is_live": boolean | null,"room": string | null,"start_time": string,"subject_id": string | null,"subject_name": string,"tag": string | null,"teacher_id": string | null,"teacher_name": string | null,"updated_at": string | null,"weekday": string
                  }
                  ComputedFields: never
                  Insert: {
                    "batch_id": string,"created_at"?: string | null,"end_time": string,"id"?: string,"institute_id": string,"is_live"?: boolean | null,"room"?: string | null,"start_time": string,"subject_id"?: string | null,"subject_name": string,"tag"?: string | null,"teacher_id"?: string | null,"teacher_name"?: string | null,"updated_at"?: string | null,"weekday": string
                  }
                  Update: {
                    "batch_id"?: string,"created_at"?: string | null,"end_time"?: string,"id"?: string,"institute_id"?: string,"is_live"?: boolean | null,"room"?: string | null,"start_time"?: string,"subject_id"?: string | null,"subject_name"?: string,"tag"?: string | null,"teacher_id"?: string | null,"teacher_name"?: string | null,"updated_at"?: string | null,"weekday"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "batch_schedule_batch_id_fkey"
      columns: ["batch_id"]
isOneToOne: false
      referencedRelation: "batches"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "batch_schedule_institute_id_fkey"
      columns: ["institute_id"]
isOneToOne: false
      referencedRelation: "institutes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "batch_schedule_subject_id_fkey"
      columns: ["subject_id"]
isOneToOne: false
      referencedRelation: "subjects"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "batch_schedule_teacher_id_fkey"
      columns: ["teacher_id"]
isOneToOne: false
      referencedRelation: "teachers"
      referencedColumns: ["id"]
    }
                  ]
                },"batch_students": {
                  Row: {
                    "batch_id": string,"enrolled_at": string | null,"id": string,"institute_id": string,"status": string | null,"student_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "batch_id": string,"enrolled_at"?: string | null,"id"?: string,"institute_id": string,"status"?: string | null,"student_id": string
                  }
                  Update: {
                    "batch_id"?: string,"enrolled_at"?: string | null,"id"?: string,"institute_id"?: string,"status"?: string | null,"student_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "batch_students_batch_id_fkey"
      columns: ["batch_id"]
isOneToOne: false
      referencedRelation: "batches"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "batch_students_institute_id_fkey"
      columns: ["institute_id"]
isOneToOne: false
      referencedRelation: "institutes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "batch_students_student_id_fkey"
      columns: ["student_id"]
isOneToOne: false
      referencedRelation: "students"
      referencedColumns: ["id"]
    }
                  ]
                },"batch_teachers": {
                  Row: {
                    "batch_id": string,"created_at": string | null,"id": string,"institute_id": string,"subject_id": string | null,"teacher_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "batch_id": string,"created_at"?: string | null,"id"?: string,"institute_id": string,"subject_id"?: string | null,"teacher_id": string
                  }
                  Update: {
                    "batch_id"?: string,"created_at"?: string | null,"id"?: string,"institute_id"?: string,"subject_id"?: string | null,"teacher_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "batch_teachers_batch_id_fkey"
      columns: ["batch_id"]
isOneToOne: false
      referencedRelation: "batches"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "batch_teachers_institute_id_fkey"
      columns: ["institute_id"]
isOneToOne: false
      referencedRelation: "institutes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "batch_teachers_subject_id_fkey"
      columns: ["subject_id"]
isOneToOne: false
      referencedRelation: "subjects"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "batch_teachers_teacher_id_fkey"
      columns: ["teacher_id"]
isOneToOne: false
      referencedRelation: "teachers"
      referencedColumns: ["id"]
    }
                  ]
                },"batches": {
                  Row: {
                    "academic_year": string | null,"created_at": string | null,"end_date": string | null,"end_time": string | null,"id": string,"institute_id": string,"is_archived": boolean | null,"name": string,"room_number": string | null,"start_date": string | null,"start_time": string | null,"status": string | null,"subject": string | null,"subject_id": string | null,"target_exam": string | null,"teacher_id": string | null,"updated_at": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "academic_year"?: string | null,"created_at"?: string | null,"end_date"?: string | null,"end_time"?: string | null,"id"?: string,"institute_id": string,"is_archived"?: boolean | null,"name": string,"room_number"?: string | null,"start_date"?: string | null,"start_time"?: string | null,"status"?: string | null,"subject"?: string | null,"subject_id"?: string | null,"target_exam"?: string | null,"teacher_id"?: string | null,"updated_at"?: string | null
                  }
                  Update: {
                    "academic_year"?: string | null,"created_at"?: string | null,"end_date"?: string | null,"end_time"?: string | null,"id"?: string,"institute_id"?: string,"is_archived"?: boolean | null,"name"?: string,"room_number"?: string | null,"start_date"?: string | null,"start_time"?: string | null,"status"?: string | null,"subject"?: string | null,"subject_id"?: string | null,"target_exam"?: string | null,"teacher_id"?: string | null,"updated_at"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "batches_institute_id_fkey"
      columns: ["institute_id"]
isOneToOne: false
      referencedRelation: "institutes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "batches_subject_id_fkey"
      columns: ["subject_id"]
isOneToOne: false
      referencedRelation: "subjects"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "batches_teacher_id_fkey"
      columns: ["teacher_id"]
isOneToOne: false
      referencedRelation: "teachers"
      referencedColumns: ["id"]
    }
                  ]
                },"chat_messages": {
                  Row: {
                    "attachment_name": string | null,"attachment_type": string | null,"attachment_url": string | null,"created_at": string,"id": string,"is_pinned": boolean,"is_read": boolean,"message_text": string | null,"room_id": string,"sender_id": string,"sender_role": string
                  }
                  ComputedFields: never
                  Insert: {
                    "attachment_name"?: string | null,"attachment_type"?: string | null,"attachment_url"?: string | null,"created_at"?: string,"id"?: string,"is_pinned"?: boolean,"is_read"?: boolean,"message_text"?: string | null,"room_id": string,"sender_id": string,"sender_role": string
                  }
                  Update: {
                    "attachment_name"?: string | null,"attachment_type"?: string | null,"attachment_url"?: string | null,"created_at"?: string,"id"?: string,"is_pinned"?: boolean,"is_read"?: boolean,"message_text"?: string | null,"room_id"?: string,"sender_id"?: string,"sender_role"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "chat_messages_room_id_fkey"
      columns: ["room_id"]
isOneToOne: false
      referencedRelation: "chat_rooms"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "chat_messages_sender_id_fkey"
      columns: ["sender_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"chat_rooms": {
                  Row: {
                    "batch_id": string | null,"created_at": string | null,"id": string,"institute_id": string,"last_message_at": string | null,"last_message_text": string | null,"name": string,"student_id": string | null,"teacher_id": string,"type": string
                  }
                  ComputedFields: never
                  Insert: {
                    "batch_id"?: string | null,"created_at"?: string | null,"id"?: string,"institute_id": string,"last_message_at"?: string | null,"last_message_text"?: string | null,"name": string,"student_id"?: string | null,"teacher_id": string,"type": string
                  }
                  Update: {
                    "batch_id"?: string | null,"created_at"?: string | null,"id"?: string,"institute_id"?: string,"last_message_at"?: string | null,"last_message_text"?: string | null,"name"?: string,"student_id"?: string | null,"teacher_id"?: string,"type"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "chat_rooms_batch_id_fkey"
      columns: ["batch_id"]
isOneToOne: false
      referencedRelation: "batches"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "chat_rooms_institute_id_fkey"
      columns: ["institute_id"]
isOneToOne: false
      referencedRelation: "institutes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "chat_rooms_student_id_fkey"
      columns: ["student_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "chat_rooms_teacher_id_fkey"
      columns: ["teacher_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"community_comments": {
                  Row: {
                    "attachment_url": string | null,"author_id": string,"comment_text": string,"created_at": string | null,"id": string,"institute_id": string,"is_teacher_verified_answer": boolean | null,"post_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "attachment_url"?: string | null,"author_id": string,"comment_text": string,"created_at"?: string | null,"id"?: string,"institute_id": string,"is_teacher_verified_answer"?: boolean | null,"post_id": string
                  }
                  Update: {
                    "attachment_url"?: string | null,"author_id"?: string,"comment_text"?: string,"created_at"?: string | null,"id"?: string,"institute_id"?: string,"is_teacher_verified_answer"?: boolean | null,"post_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "community_comments_author_id_fkey"
      columns: ["author_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "community_comments_institute_id_fkey"
      columns: ["institute_id"]
isOneToOne: false
      referencedRelation: "institutes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "community_comments_post_id_fkey"
      columns: ["post_id"]
isOneToOne: false
      referencedRelation: "community_posts"
      referencedColumns: ["id"]
    }
                  ]
                },"community_posts": {
                  Row: {
                    "author_id": string,"batch_id": string | null,"content": string,"created_at": string | null,"id": string,"image_url": string | null,"institute_id": string,"is_pinned": boolean | null,"is_resolved": boolean | null,"pdf_or_file_url": string | null,"subject_id": string | null,"title": string,"upvotes_count": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "author_id": string,"batch_id"?: string | null,"content": string,"created_at"?: string | null,"id"?: string,"image_url"?: string | null,"institute_id": string,"is_pinned"?: boolean | null,"is_resolved"?: boolean | null,"pdf_or_file_url"?: string | null,"subject_id"?: string | null,"title": string,"upvotes_count"?: number | null
                  }
                  Update: {
                    "author_id"?: string,"batch_id"?: string | null,"content"?: string,"created_at"?: string | null,"id"?: string,"image_url"?: string | null,"institute_id"?: string,"is_pinned"?: boolean | null,"is_resolved"?: boolean | null,"pdf_or_file_url"?: string | null,"subject_id"?: string | null,"title"?: string,"upvotes_count"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "community_posts_author_id_fkey"
      columns: ["author_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "community_posts_batch_id_fkey"
      columns: ["batch_id"]
isOneToOne: false
      referencedRelation: "batches"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "community_posts_institute_id_fkey"
      columns: ["institute_id"]
isOneToOne: false
      referencedRelation: "institutes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "community_posts_subject_id_fkey"
      columns: ["subject_id"]
isOneToOne: false
      referencedRelation: "subjects"
      referencedColumns: ["id"]
    }
                  ]
                },"community_upvotes": {
                  Row: {
                    "created_at": string | null,"id": string,"post_id": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string | null,"id"?: string,"post_id": string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string | null,"id"?: string,"post_id"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "community_upvotes_post_id_fkey"
      columns: ["post_id"]
isOneToOne: false
      referencedRelation: "community_posts"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "community_upvotes_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"examinations": {
                  Row: {
                    "batch_average_marks": number | null,"batch_highest_marks": number | null,"batch_id": string,"created_at": string | null,"exam_date": string,"id": string,"institute_id": string,"is_published": boolean | null,"max_marks": number,"passing_marks": number,"subject_id": string | null,"syllabus": string | null,"title": string
                  }
                  ComputedFields: never
                  Insert: {
                    "batch_average_marks"?: number | null,"batch_highest_marks"?: number | null,"batch_id": string,"created_at"?: string | null,"exam_date": string,"id"?: string,"institute_id": string,"is_published"?: boolean | null,"max_marks"?: number,"passing_marks"?: number,"subject_id"?: string | null,"syllabus"?: string | null,"title": string
                  }
                  Update: {
                    "batch_average_marks"?: number | null,"batch_highest_marks"?: number | null,"batch_id"?: string,"created_at"?: string | null,"exam_date"?: string,"id"?: string,"institute_id"?: string,"is_published"?: boolean | null,"max_marks"?: number,"passing_marks"?: number,"subject_id"?: string | null,"syllabus"?: string | null,"title"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "examinations_batch_id_fkey"
      columns: ["batch_id"]
isOneToOne: false
      referencedRelation: "batches"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "examinations_institute_id_fkey"
      columns: ["institute_id"]
isOneToOne: false
      referencedRelation: "institutes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "examinations_subject_id_fkey"
      columns: ["subject_id"]
isOneToOne: false
      referencedRelation: "subjects"
      referencedColumns: ["id"]
    }
                  ]
                },"fee_plans": {
                  Row: {
                    "amount": number,"batch_id": string | null,"created_at": string | null,"description": string | null,"frequency": string | null,"id": string,"institute_id": string,"name": string,"total_amount": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "amount": number,"batch_id"?: string | null,"created_at"?: string | null,"description"?: string | null,"frequency"?: string | null,"id"?: string,"institute_id": string,"name": string,"total_amount"?: number | null
                  }
                  Update: {
                    "amount"?: number,"batch_id"?: string | null,"created_at"?: string | null,"description"?: string | null,"frequency"?: string | null,"id"?: string,"institute_id"?: string,"name"?: string,"total_amount"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "fee_plans_batch_id_fkey"
      columns: ["batch_id"]
isOneToOne: false
      referencedRelation: "batches"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "fee_plans_institute_id_fkey"
      columns: ["institute_id"]
isOneToOne: false
      referencedRelation: "institutes"
      referencedColumns: ["id"]
    }
                  ]
                },"institute_code_lookup_attempts": {
                  Row: {
                    "attempted_at": string | null,"code_attempted": string,"id": string,"user_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "attempted_at"?: string | null,"code_attempted": string,"id"?: string,"user_id"?: string | null
                  }
                  Update: {
                    "attempted_at"?: string | null,"code_attempted"?: string,"id"?: string,"user_id"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"institute_members": {
                  Row: {
                    "created_at": string | null,"id": string,"institute_id": string,"joined_at": string | null,"role": Database["public"]['Enums']["app_role_enum"],"status": Database["public"]['Enums']["member_status_enum"],"user_id": string,"verification_status": Database["public"]['Enums']["verification_status_enum"],"verified_at": string | null,"verified_by": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string | null,"id"?: string,"institute_id": string,"joined_at"?: string | null,"role"?: Database["public"]['Enums']["app_role_enum"],"status"?: Database["public"]['Enums']["member_status_enum"],"user_id": string,"verification_status"?: Database["public"]['Enums']["verification_status_enum"],"verified_at"?: string | null,"verified_by"?: string | null
                  }
                  Update: {
                    "created_at"?: string | null,"id"?: string,"institute_id"?: string,"joined_at"?: string | null,"role"?: Database["public"]['Enums']["app_role_enum"],"status"?: Database["public"]['Enums']["member_status_enum"],"user_id"?: string,"verification_status"?: Database["public"]['Enums']["verification_status_enum"],"verified_at"?: string | null,"verified_by"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "institute_members_institute_id_fkey"
      columns: ["institute_id"]
isOneToOne: false
      referencedRelation: "institutes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "institute_members_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "institute_members_verified_by_fkey"
      columns: ["verified_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"institutes": {
                  Row: {
                    "account_type": Database["public"]['Enums']["account_type_enum"],"address": string | null,"banner_url": string | null,"campus_name": string | null,"center_code": string,"city": string,"code": string | null,"created_at": string | null,"email": string | null,"id": string,"invite_code": string,"is_active": boolean | null,"logo_url": string | null,"name": string,"owner_id": string | null,"phone": string | null,"state": string | null,"updated_at": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "account_type"?: Database["public"]['Enums']["account_type_enum"],"address"?: string | null,"banner_url"?: string | null,"campus_name"?: string | null,"center_code": string,"city": string,"code"?: string | null,"created_at"?: string | null,"email"?: string | null,"id"?: string,"invite_code": string,"is_active"?: boolean | null,"logo_url"?: string | null,"name": string,"owner_id"?: string | null,"phone"?: string | null,"state"?: string | null,"updated_at"?: string | null
                  }
                  Update: {
                    "account_type"?: Database["public"]['Enums']["account_type_enum"],"address"?: string | null,"banner_url"?: string | null,"campus_name"?: string | null,"center_code"?: string,"city"?: string,"code"?: string | null,"created_at"?: string | null,"email"?: string | null,"id"?: string,"invite_code"?: string,"is_active"?: boolean | null,"logo_url"?: string | null,"name"?: string,"owner_id"?: string | null,"phone"?: string | null,"state"?: string | null,"updated_at"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"invites": {
                  Row: {
                    "batch_id": string | null,"code": string,"created_at": string | null,"created_by": string | null,"expires_at": string | null,"id": string,"institute_id": string,"max_uses": number,"role": Database["public"]['Enums']["app_role_enum"],"updated_at": string | null,"used_count": number
                  }
                  ComputedFields: never
                  Insert: {
                    "batch_id"?: string | null,"code": string,"created_at"?: string | null,"created_by"?: string | null,"expires_at"?: string | null,"id"?: string,"institute_id": string,"max_uses"?: number,"role"?: Database["public"]['Enums']["app_role_enum"],"updated_at"?: string | null,"used_count"?: number
                  }
                  Update: {
                    "batch_id"?: string | null,"code"?: string,"created_at"?: string | null,"created_by"?: string | null,"expires_at"?: string | null,"id"?: string,"institute_id"?: string,"max_uses"?: number,"role"?: Database["public"]['Enums']["app_role_enum"],"updated_at"?: string | null,"used_count"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "invites_batch_id_fkey"
      columns: ["batch_id"]
isOneToOne: false
      referencedRelation: "batches"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "invites_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "invites_institute_id_fkey"
      columns: ["institute_id"]
isOneToOne: false
      referencedRelation: "institutes"
      referencedColumns: ["id"]
    }
                  ]
                },"join_requests": {
                  Row: {
                    "assigned_batch_id": string | null,"code_used": string,"created_at": string | null,"id": string,"institute_id": string,"reapplied_at": string | null,"rejection_reason": string | null,"requested_role": Database["public"]['Enums']["app_role_enum"],"reviewed_at": string | null,"reviewed_by": string | null,"status": string,"student_extra_details_json": Json | null,"teacher_id": string | null,"user_id": string,"waitlist_reason": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "assigned_batch_id"?: string | null,"code_used": string,"created_at"?: string | null,"id"?: string,"institute_id": string,"reapplied_at"?: string | null,"rejection_reason"?: string | null,"requested_role"?: Database["public"]['Enums']["app_role_enum"],"reviewed_at"?: string | null,"reviewed_by"?: string | null,"status"?: string,"student_extra_details_json"?: Json | null,"teacher_id"?: string | null,"user_id": string,"waitlist_reason"?: string | null
                  }
                  Update: {
                    "assigned_batch_id"?: string | null,"code_used"?: string,"created_at"?: string | null,"id"?: string,"institute_id"?: string,"reapplied_at"?: string | null,"rejection_reason"?: string | null,"requested_role"?: Database["public"]['Enums']["app_role_enum"],"reviewed_at"?: string | null,"reviewed_by"?: string | null,"status"?: string,"student_extra_details_json"?: Json | null,"teacher_id"?: string | null,"user_id"?: string,"waitlist_reason"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "join_requests_assigned_batch_id_fkey"
      columns: ["assigned_batch_id"]
isOneToOne: false
      referencedRelation: "batches"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "join_requests_institute_id_fkey"
      columns: ["institute_id"]
isOneToOne: false
      referencedRelation: "institutes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "join_requests_reviewed_by_fkey"
      columns: ["reviewed_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "join_requests_teacher_id_fkey"
      columns: ["teacher_id"]
isOneToOne: false
      referencedRelation: "teachers"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "join_requests_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"lectures": {
                  Row: {
                    "batch_id": string,"created_at": string | null,"description": string | null,"duration_minutes": number | null,"duration_seconds": number | null,"faculty_name": string | null,"id": string,"institute_id": string,"is_live": boolean | null,"is_published": boolean | null,"provider": Database["public"]['Enums']["video_provider_enum"],"subject": string | null,"subject_id": string | null,"thumbnail_url": string | null,"title": string,"uploaded_by": string | null,"video_id_or_url": string
                  }
                  ComputedFields: never
                  Insert: {
                    "batch_id": string,"created_at"?: string | null,"description"?: string | null,"duration_minutes"?: number | null,"duration_seconds"?: number | null,"faculty_name"?: string | null,"id"?: string,"institute_id": string,"is_live"?: boolean | null,"is_published"?: boolean | null,"provider"?: Database["public"]['Enums']["video_provider_enum"],"subject"?: string | null,"subject_id"?: string | null,"thumbnail_url"?: string | null,"title": string,"uploaded_by"?: string | null,"video_id_or_url": string
                  }
                  Update: {
                    "batch_id"?: string,"created_at"?: string | null,"description"?: string | null,"duration_minutes"?: number | null,"duration_seconds"?: number | null,"faculty_name"?: string | null,"id"?: string,"institute_id"?: string,"is_live"?: boolean | null,"is_published"?: boolean | null,"provider"?: Database["public"]['Enums']["video_provider_enum"],"subject"?: string | null,"subject_id"?: string | null,"thumbnail_url"?: string | null,"title"?: string,"uploaded_by"?: string | null,"video_id_or_url"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "lectures_batch_id_fkey"
      columns: ["batch_id"]
isOneToOne: false
      referencedRelation: "batches"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "lectures_institute_id_fkey"
      columns: ["institute_id"]
isOneToOne: false
      referencedRelation: "institutes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "lectures_subject_id_fkey"
      columns: ["subject_id"]
isOneToOne: false
      referencedRelation: "subjects"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "lectures_uploaded_by_fkey"
      columns: ["uploaded_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"notifications": {
                  Row: {
                    "body": string | null,"created_at": string | null,"data": Json | null,"deep_link_data": Json | null,"id": string,"institute_id": string,"is_read": boolean | null,"message": string | null,"recipient_id": string | null,"recipient_role": string | null,"title": string,"type": string | null,"user_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "body"?: string | null,"created_at"?: string | null,"data"?: Json | null,"deep_link_data"?: Json | null,"id"?: string,"institute_id": string,"is_read"?: boolean | null,"message"?: string | null,"recipient_id"?: string | null,"recipient_role"?: string | null,"title": string,"type"?: string | null,"user_id"?: string | null
                  }
                  Update: {
                    "body"?: string | null,"created_at"?: string | null,"data"?: Json | null,"deep_link_data"?: Json | null,"id"?: string,"institute_id"?: string,"is_read"?: boolean | null,"message"?: string | null,"recipient_id"?: string | null,"recipient_role"?: string | null,"title"?: string,"type"?: string | null,"user_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "notifications_institute_id_fkey"
      columns: ["institute_id"]
isOneToOne: false
      referencedRelation: "institutes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "notifications_recipient_id_fkey"
      columns: ["recipient_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "notifications_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"parent_student_links": {
                  Row: {
                    "created_at": string | null,"id": string,"institute_id": string,"parent_id": string,"relationship": string | null,"status": string,"student_code_entered": string | null,"student_id": string,"updated_at": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string | null,"id"?: string,"institute_id": string,"parent_id": string,"relationship"?: string | null,"status"?: string,"student_code_entered"?: string | null,"student_id": string,"updated_at"?: string | null
                  }
                  Update: {
                    "created_at"?: string | null,"id"?: string,"institute_id"?: string,"parent_id"?: string,"relationship"?: string | null,"status"?: string,"student_code_entered"?: string | null,"student_id"?: string,"updated_at"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "parent_student_links_institute_id_fkey"
      columns: ["institute_id"]
isOneToOne: false
      referencedRelation: "institutes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "parent_student_links_parent_id_fkey"
      columns: ["parent_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "parent_student_links_student_id_fkey"
      columns: ["student_id"]
isOneToOne: false
      referencedRelation: "students"
      referencedColumns: ["id"]
    }
                  ]
                },"parent_students": {
                  Row: {
                    "created_at": string | null,"id": string,"institute_id": string,"parent_id": string,"relationship": string | null,"student_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string | null,"id"?: string,"institute_id": string,"parent_id": string,"relationship"?: string | null,"student_id": string
                  }
                  Update: {
                    "created_at"?: string | null,"id"?: string,"institute_id"?: string,"parent_id"?: string,"relationship"?: string | null,"student_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "parent_students_institute_id_fkey"
      columns: ["institute_id"]
isOneToOne: false
      referencedRelation: "institutes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "parent_students_parent_id_fkey"
      columns: ["parent_id"]
isOneToOne: false
      referencedRelation: "parents"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "parent_students_student_id_fkey"
      columns: ["student_id"]
isOneToOne: false
      referencedRelation: "students"
      referencedColumns: ["id"]
    }
                  ]
                },"parents": {
                  Row: {
                    "alternate_phone": string | null,"created_at": string | null,"id": string,"institute_id": string,"occupation": string | null,"phone": string | null,"relationship_type": string | null,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "alternate_phone"?: string | null,"created_at"?: string | null,"id"?: string,"institute_id": string,"occupation"?: string | null,"phone"?: string | null,"relationship_type"?: string | null,"user_id": string
                  }
                  Update: {
                    "alternate_phone"?: string | null,"created_at"?: string | null,"id"?: string,"institute_id"?: string,"occupation"?: string | null,"phone"?: string | null,"relationship_type"?: string | null,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "parents_institute_id_fkey"
      columns: ["institute_id"]
isOneToOne: false
      referencedRelation: "institutes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "parents_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"payments": {
                  Row: {
                    "amount": number,"created_at": string | null,"gst_amount": number | null,"id": string,"institute_id": string,"notes": string | null,"paid_at": string | null,"payment_method": string | null,"payment_mode": string | null,"razorpay_order_id": string | null,"razorpay_payment_id": string | null,"razorpay_signature": string | null,"receipt_number": string,"recorded_by": string | null,"status": string | null,"student_fee_id": string,"student_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "amount": number,"created_at"?: string | null,"gst_amount"?: number | null,"id"?: string,"institute_id": string,"notes"?: string | null,"paid_at"?: string | null,"payment_method"?: string | null,"payment_mode"?: string | null,"razorpay_order_id"?: string | null,"razorpay_payment_id"?: string | null,"razorpay_signature"?: string | null,"receipt_number": string,"recorded_by"?: string | null,"status"?: string | null,"student_fee_id": string,"student_id": string
                  }
                  Update: {
                    "amount"?: number,"created_at"?: string | null,"gst_amount"?: number | null,"id"?: string,"institute_id"?: string,"notes"?: string | null,"paid_at"?: string | null,"payment_method"?: string | null,"payment_mode"?: string | null,"razorpay_order_id"?: string | null,"razorpay_payment_id"?: string | null,"razorpay_signature"?: string | null,"receipt_number"?: string,"recorded_by"?: string | null,"status"?: string | null,"student_fee_id"?: string,"student_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "payments_institute_id_fkey"
      columns: ["institute_id"]
isOneToOne: false
      referencedRelation: "institutes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "payments_recorded_by_fkey"
      columns: ["recorded_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "payments_student_fee_id_fkey"
      columns: ["student_fee_id"]
isOneToOne: false
      referencedRelation: "student_fees"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "payments_student_id_fkey"
      columns: ["student_id"]
isOneToOne: false
      referencedRelation: "students"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "avatar_url": string | null,"created_at": string | null,"default_role": Database["public"]['Enums']["app_role_enum"],"email": string,"expo_push_token": string | null,"full_name": string,"id": string,"is_deleted": boolean | null,"phone": string | null,"updated_at": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "avatar_url"?: string | null,"created_at"?: string | null,"default_role"?: Database["public"]['Enums']["app_role_enum"],"email": string,"expo_push_token"?: string | null,"full_name": string,"id": string,"is_deleted"?: boolean | null,"phone"?: string | null,"updated_at"?: string | null
                  }
                  Update: {
                    "avatar_url"?: string | null,"created_at"?: string | null,"default_role"?: Database["public"]['Enums']["app_role_enum"],"email"?: string,"expo_push_token"?: string | null,"full_name"?: string,"id"?: string,"is_deleted"?: boolean | null,"phone"?: string | null,"updated_at"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"push_tokens": {
                  Row: {
                    "created_at": string | null,"device_id": string | null,"id": string,"is_active": boolean | null,"platform": string | null,"token": string,"updated_at": string | null,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string | null,"device_id"?: string | null,"id"?: string,"is_active"?: boolean | null,"platform"?: string | null,"token": string,"updated_at"?: string | null,"user_id": string
                  }
                  Update: {
                    "created_at"?: string | null,"device_id"?: string | null,"id"?: string,"is_active"?: boolean | null,"platform"?: string | null,"token"?: string,"updated_at"?: string | null,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "push_tokens_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"quiz_answer_keys": {
                  Row: {
                    "answer_keys": NonNullable<Json>,"assignment_id": string,"created_at": string | null,"institute_id": string,"updated_at": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "answer_keys"?: NonNullable<Json>,"assignment_id": string,"created_at"?: string | null,"institute_id": string,"updated_at"?: string | null
                  }
                  Update: {
                    "answer_keys"?: NonNullable<Json>,"assignment_id"?: string,"created_at"?: string | null,"institute_id"?: string,"updated_at"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "quiz_answer_keys_assignment_id_fkey"
      columns: ["assignment_id"]
isOneToOne: true
      referencedRelation: "assignments"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "quiz_answer_keys_institute_id_fkey"
      columns: ["institute_id"]
isOneToOne: false
      referencedRelation: "institutes"
      referencedColumns: ["id"]
    }
                  ]
                },"receipts": {
                  Row: {
                    "generated_at": string,"gst_amount": number,"gst_rate": number,"id": string,"institute_id": string,"payment_id": string,"receipt_number": string,"signed_hash": string | null,"student_id": string,"taxable_amount": number,"total_amount": number
                  }
                  ComputedFields: never
                  Insert: {
                    "generated_at"?: string,"gst_amount"?: number,"gst_rate"?: number,"id"?: string,"institute_id": string,"payment_id": string,"receipt_number": string,"signed_hash"?: string | null,"student_id": string,"taxable_amount": number,"total_amount": number
                  }
                  Update: {
                    "generated_at"?: string,"gst_amount"?: number,"gst_rate"?: number,"id"?: string,"institute_id"?: string,"payment_id"?: string,"receipt_number"?: string,"signed_hash"?: string | null,"student_id"?: string,"taxable_amount"?: number,"total_amount"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "receipts_institute_id_fkey"
      columns: ["institute_id"]
isOneToOne: false
      referencedRelation: "institutes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "receipts_payment_id_fkey"
      columns: ["payment_id"]
isOneToOne: true
      referencedRelation: "payments"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "receipts_student_id_fkey"
      columns: ["student_id"]
isOneToOne: false
      referencedRelation: "students"
      referencedColumns: ["id"]
    }
                  ]
                },"results": {
                  Row: {
                    "batch_rank": number | null,"created_at": string | null,"examination_id": string,"grade": string | null,"id": string,"institute_id": string,"is_absent": boolean | null,"marks_obtained": number,"percentage": number,"recorded_by": string | null,"remarks": string | null,"student_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "batch_rank"?: number | null,"created_at"?: string | null,"examination_id": string,"grade"?: string | null,"id"?: string,"institute_id": string,"is_absent"?: boolean | null,"marks_obtained"?: number,"percentage"?: number,"recorded_by"?: string | null,"remarks"?: string | null,"student_id": string
                  }
                  Update: {
                    "batch_rank"?: number | null,"created_at"?: string | null,"examination_id"?: string,"grade"?: string | null,"id"?: string,"institute_id"?: string,"is_absent"?: boolean | null,"marks_obtained"?: number,"percentage"?: number,"recorded_by"?: string | null,"remarks"?: string | null,"student_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "results_examination_id_fkey"
      columns: ["examination_id"]
isOneToOne: false
      referencedRelation: "examinations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "results_institute_id_fkey"
      columns: ["institute_id"]
isOneToOne: false
      referencedRelation: "institutes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "results_recorded_by_fkey"
      columns: ["recorded_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "results_student_id_fkey"
      columns: ["student_id"]
isOneToOne: false
      referencedRelation: "students"
      referencedColumns: ["id"]
    }
                  ]
                },"student_fees": {
                  Row: {
                    "created_at": string | null,"discount_amount": number | null,"due_date": string,"fee_plan_id": string | null,"id": string,"institute_id": string,"net_payable": number | null,"paid_amount": number,"pending_amount": number,"status": string,"student_id": string,"title": string,"total_amount": number,"updated_at": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string | null,"discount_amount"?: number | null,"due_date": string,"fee_plan_id"?: string | null,"id"?: string,"institute_id": string,"net_payable"?: number | null,"paid_amount"?: number,"pending_amount": number,"status"?: string,"student_id": string,"title": string,"total_amount": number,"updated_at"?: string | null
                  }
                  Update: {
                    "created_at"?: string | null,"discount_amount"?: number | null,"due_date"?: string,"fee_plan_id"?: string | null,"id"?: string,"institute_id"?: string,"net_payable"?: number | null,"paid_amount"?: number,"pending_amount"?: number,"status"?: string,"student_id"?: string,"title"?: string,"total_amount"?: number,"updated_at"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "student_fees_fee_plan_id_fkey"
      columns: ["fee_plan_id"]
isOneToOne: false
      referencedRelation: "fee_plans"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "student_fees_institute_id_fkey"
      columns: ["institute_id"]
isOneToOne: false
      referencedRelation: "institutes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "student_fees_student_id_fkey"
      columns: ["student_id"]
isOneToOne: false
      referencedRelation: "students"
      referencedColumns: ["id"]
    }
                  ]
                },"students": {
                  Row: {
                    "address": string | null,"admission_date": string | null,"admission_number": string | null,"blood_group": string | null,"board": string | null,"class_grade": string,"created_at": string | null,"dob": string | null,"emergency_contact_name": string | null,"emergency_contact_phone": string | null,"grade": string | null,"guardian_name": string | null,"guardian_phone": string | null,"id": string,"institute_id": string,"is_archived": boolean | null,"medium": string | null,"parent_link_code": string,"previous_percentage": string | null,"roll_number": string,"school_name": string | null,"school_or_college": string | null,"target_exam": string | null,"user_id": string,"weak_subjects": (string)[] | null,"weak_topics": (string)[] | null
                  }
                  ComputedFields: never
                  Insert: {
                    "address"?: string | null,"admission_date"?: string | null,"admission_number"?: string | null,"blood_group"?: string | null,"board"?: string | null,"class_grade": string,"created_at"?: string | null,"dob"?: string | null,"emergency_contact_name"?: string | null,"emergency_contact_phone"?: string | null,"grade"?: string | null,"guardian_name"?: string | null,"guardian_phone"?: string | null,"id"?: string,"institute_id": string,"is_archived"?: boolean | null,"medium"?: string | null,"parent_link_code": string,"previous_percentage"?: string | null,"roll_number": string,"school_name"?: string | null,"school_or_college"?: string | null,"target_exam"?: string | null,"user_id": string,"weak_subjects"?: (string)[] | null,"weak_topics"?: (string)[] | null
                  }
                  Update: {
                    "address"?: string | null,"admission_date"?: string | null,"admission_number"?: string | null,"blood_group"?: string | null,"board"?: string | null,"class_grade"?: string,"created_at"?: string | null,"dob"?: string | null,"emergency_contact_name"?: string | null,"emergency_contact_phone"?: string | null,"grade"?: string | null,"guardian_name"?: string | null,"guardian_phone"?: string | null,"id"?: string,"institute_id"?: string,"is_archived"?: boolean | null,"medium"?: string | null,"parent_link_code"?: string,"previous_percentage"?: string | null,"roll_number"?: string,"school_name"?: string | null,"school_or_college"?: string | null,"target_exam"?: string | null,"user_id"?: string,"weak_subjects"?: (string)[] | null,"weak_topics"?: (string)[] | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "students_institute_id_fkey"
      columns: ["institute_id"]
isOneToOne: false
      referencedRelation: "institutes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "students_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"study_materials": {
                  Row: {
                    "batch_id": string | null,"category": string | null,"created_at": string | null,"description": string | null,"download_count": number | null,"file_size": string | null,"file_size_bytes": number | null,"file_type": string | null,"file_url": string,"id": string,"institute_id": string,"subject": string | null,"subject_id": string | null,"title": string,"uploaded_by": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "batch_id"?: string | null,"category"?: string | null,"created_at"?: string | null,"description"?: string | null,"download_count"?: number | null,"file_size"?: string | null,"file_size_bytes"?: number | null,"file_type"?: string | null,"file_url": string,"id"?: string,"institute_id": string,"subject"?: string | null,"subject_id"?: string | null,"title": string,"uploaded_by"?: string | null
                  }
                  Update: {
                    "batch_id"?: string | null,"category"?: string | null,"created_at"?: string | null,"description"?: string | null,"download_count"?: number | null,"file_size"?: string | null,"file_size_bytes"?: number | null,"file_type"?: string | null,"file_url"?: string,"id"?: string,"institute_id"?: string,"subject"?: string | null,"subject_id"?: string | null,"title"?: string,"uploaded_by"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "study_materials_batch_id_fkey"
      columns: ["batch_id"]
isOneToOne: false
      referencedRelation: "batches"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "study_materials_institute_id_fkey"
      columns: ["institute_id"]
isOneToOne: false
      referencedRelation: "institutes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "study_materials_subject_id_fkey"
      columns: ["subject_id"]
isOneToOne: false
      referencedRelation: "subjects"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "study_materials_uploaded_by_fkey"
      columns: ["uploaded_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"subjects": {
                  Row: {
                    "code": string,"color_hex": string | null,"created_at": string | null,"description": string | null,"id": string,"institute_id": string,"name": string
                  }
                  ComputedFields: never
                  Insert: {
                    "code": string,"color_hex"?: string | null,"created_at"?: string | null,"description"?: string | null,"id"?: string,"institute_id": string,"name": string
                  }
                  Update: {
                    "code"?: string,"color_hex"?: string | null,"created_at"?: string | null,"description"?: string | null,"id"?: string,"institute_id"?: string,"name"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "subjects_institute_id_fkey"
      columns: ["institute_id"]
isOneToOne: false
      referencedRelation: "institutes"
      referencedColumns: ["id"]
    }
                  ]
                },"submissions": {
                  Row: {
                    "answers": Json | null,"assignment_id": string,"attempt_number": number | null,"feedback": string | null,"file_url": string | null,"file_urls": Json | null,"graded_at": string | null,"graded_by": string | null,"id": string,"institute_id": string,"is_late": boolean | null,"marks_obtained": number | null,"resubmission_count": number | null,"returned_at": string | null,"score": number | null,"status": string | null,"student_id": string,"submission_text": string | null,"submitted_at": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "answers"?: Json | null,"assignment_id": string,"attempt_number"?: number | null,"feedback"?: string | null,"file_url"?: string | null,"file_urls"?: Json | null,"graded_at"?: string | null,"graded_by"?: string | null,"id"?: string,"institute_id": string,"is_late"?: boolean | null,"marks_obtained"?: number | null,"resubmission_count"?: number | null,"returned_at"?: string | null,"score"?: number | null,"status"?: string | null,"student_id": string,"submission_text"?: string | null,"submitted_at"?: string | null
                  }
                  Update: {
                    "answers"?: Json | null,"assignment_id"?: string,"attempt_number"?: number | null,"feedback"?: string | null,"file_url"?: string | null,"file_urls"?: Json | null,"graded_at"?: string | null,"graded_by"?: string | null,"id"?: string,"institute_id"?: string,"is_late"?: boolean | null,"marks_obtained"?: number | null,"resubmission_count"?: number | null,"returned_at"?: string | null,"score"?: number | null,"status"?: string | null,"student_id"?: string,"submission_text"?: string | null,"submitted_at"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "submissions_assignment_id_fkey"
      columns: ["assignment_id"]
isOneToOne: false
      referencedRelation: "assignments"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "submissions_graded_by_fkey"
      columns: ["graded_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "submissions_institute_id_fkey"
      columns: ["institute_id"]
isOneToOne: false
      referencedRelation: "institutes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "submissions_student_id_fkey"
      columns: ["student_id"]
isOneToOne: false
      referencedRelation: "students"
      referencedColumns: ["id"]
    }
                  ]
                },"teachers": {
                  Row: {
                    "achievements": string | null,"bio": string | null,"created_at": string | null,"demo_video_url": string | null,"experience_years": number | null,"id": string,"institute_id": string,"joining_date": string | null,"mode": string | null,"monthly_fee_rate": number | null,"qualification": string | null,"specialization": string | null,"specialization_subjects": (string)[] | null,"teacher_code": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "achievements"?: string | null,"bio"?: string | null,"created_at"?: string | null,"demo_video_url"?: string | null,"experience_years"?: number | null,"id"?: string,"institute_id": string,"joining_date"?: string | null,"mode"?: string | null,"monthly_fee_rate"?: number | null,"qualification"?: string | null,"specialization"?: string | null,"specialization_subjects"?: (string)[] | null,"teacher_code": string,"user_id": string
                  }
                  Update: {
                    "achievements"?: string | null,"bio"?: string | null,"created_at"?: string | null,"demo_video_url"?: string | null,"experience_years"?: number | null,"id"?: string,"institute_id"?: string,"joining_date"?: string | null,"mode"?: string | null,"monthly_fee_rate"?: number | null,"qualification"?: string | null,"specialization"?: string | null,"specialization_subjects"?: (string)[] | null,"teacher_code"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "teachers_institute_id_fkey"
      columns: ["institute_id"]
isOneToOne: false
      referencedRelation: "institutes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "teachers_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "accept_invite_code":
{ Args: { "p_code": string }; Returns: Json
                           },
"approve_join_request":
{ Args: { "p_batch_id": string,"p_request_id": string }; Returns: Json
                           },
"auth_institute_id":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"auth_role":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"commit_attendance":
{ Args: { "p_batch_id": string,"p_date": string,"p_rows": Json }; Returns: Json
                           },
"correct_attendance":
{ Args: { "p_attendance_id": string,"p_new_status": string,"p_reason": string }; Returns: Json
                           },
"create_institute_and_admin":
{ Args: { "p_center_code": string,"p_city": string,"p_name": string,"p_phone"?: string,"p_subjects"?: (string)[] }; Returns: Json
                           },
"current_student_id":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"current_teacher_id":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"deactivate_push_token":
{ Args: { "p_token": string }; Returns: Json
                           },
"export_user_data":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"get_quiz_for_student":
{ Args: { "p_assignment_id": string }; Returns: Json
                           },
"grade_written_submission":
{ Args: { "p_feedback": string,"p_return_for_rework"?: boolean,"p_score": number,"p_submission_id": string }; Returns: Json
                           },
"is_institute_admin":
{ Args: { "target_inst_id": string }; Returns: boolean
                           },
"is_institute_member":
{ Args: { "target_inst_id": string }; Returns: boolean
                           },
"is_parent_of":
{ Args: { "target_student_id": string }; Returns: boolean
                           },
"is_student_in_batch":
{ Args: { "target_batch_id": string }; Returns: boolean
                           },
"is_student_of_batch":
{ Args: { "target_batch_id": string }; Returns: boolean
                           },
"is_teacher_of_batch":
{ Args: { "target_batch_id": string }; Returns: boolean
                           },
"is_teacher_of_student":
{ Args: { "target_student_id": string }; Returns: boolean
                           },
"join_institute_as_teacher":
{ Args: { "p_bio"?: string,"p_code": string,"p_experience_years"?: number,"p_monthly_fee_rate"?: number,"p_qualification"?: string,"p_specialization"?: string,"p_specialization_subjects"?: (string)[] }; Returns: Json
                           },
"link_child_by_code":
{ Args: { "p_relationship"?: string,"p_student_code": string }; Returns: Json
                           },
"lookup_institute_by_code":
{ Args: { "p_code": string }; Returns: Json
                           },
"post_announcement":
{ Args: { "p_batch_id": string,"p_content": string,"p_institute_id": string,"p_priority"?: string,"p_title": string }; Returns: Json
                           },
"reapply_join_request":
{ Args: { "p_request_id": string,"p_updated_details": Json }; Returns: Json
                           },
"register_push_token":
{ Args: { "p_device_id"?: string,"p_platform": string,"p_token": string }; Returns: Json
                           },
"reject_join_request":
{ Args: { "p_reason": string,"p_request_id": string }; Returns: Json
                           },
"request_account_deletion":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"request_parent_child_link":
{ Args: { "p_relationship"?: string,"p_student_code": string }; Returns: Json
                           },
"submit_and_grade_quiz":
{ Args: { "p_answers": Json,"p_assignment_id": string,"p_student_id": string }; Returns: Json
                           },
"submit_quiz":
{ Args: { "p_answers": Json,"p_assignment_id": string }; Returns: Json
                           },
"submit_written_homework":
{ Args: { "p_assignment_id": string,"p_file_urls": Json,"p_submission_text": string }; Returns: Json
                           },
"waitlist_join_request":
{ Args: { "p_reason": string,"p_request_id": string }; Returns: Json
                           }
          }
          Enums: {
            "account_type_enum": "coaching_center"|"individual_teacher","app_role_enum": "admin"|"teacher"|"student"|"parent","assignment_type_enum": "file"|"quiz","member_status_enum": "active"|"suspended"|"pending","verification_status_enum": "pending"|"verified"|"rejected","video_provider_enum": "youtube"|"bunny"|"direct"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            "account_type_enum": ["coaching_center", "individual_teacher"],"app_role_enum": ["admin", "teacher", "student", "parent"],"assignment_type_enum": ["file", "quiz"],"member_status_enum": ["active", "suspended", "pending"],"verification_status_enum": ["pending", "verified", "rejected"],"video_provider_enum": ["youtube", "bunny", "direct"]
          }
        }
} as const

// ==============================================================================
// APPLICATION LEVEL HELPER TYPES & EXTENDED MODELS
// ==============================================================================

export type UserRole = 'admin' | 'teacher' | 'student' | 'parent';
export type VerificationStatus = 'pending' | 'verified' | 'rejected' | 'waitlisted' | 'approved';
export type MemberStatus = 'active' | 'suspended' | 'pending';
export type AssignmentType = 'file' | 'quiz' | 'written' | 'mcq';
export type FeeStatus = 'paid' | 'partial' | 'pending' | 'overdue';
export type PaymentMode = 'razorpay' | 'upi' | 'cash' | 'bank_transfer' | 'cheque' | 'bank';
export type PaymentStatus = 'paid' | 'success' | 'pending' | 'failed' | 'refunded';

export interface BatchSchedule {
  id: string;
  institute_id: string;
  batch_id: string;
  subject_id?: string;
  teacher_id?: string;
  subject_name?: string;
  teacher_name?: string;
  weekday: string;
  start_time: string;
  end_time: string;
  room?: string;
  tag?: string;
  is_live?: boolean;
  created_at?: string;
  updated_at?: string;
}

// Core Entities (0001_core.sql)
// ------------------------------------------------------------------------------

export interface Institute {
  id: string;
  name: string;
  code: string;
  center_code: string;
  invite_code?: string;
  account_type?: 'coaching_center' | 'individual_teacher';
  city: string;
  campus_name?: string;
  tagline?: string;
  slug?: string;
  join_code?: string;
  address?: string;
  state?: string;
  pincode?: string;
  is_active?: boolean;
  contact_email?: string;
  contact_phone?: string;
  logo_url?: string;
  banner_url?: string;
  phone?: string;
  email?: string;
  owner_id?: string;
  created_at: string;
  updated_at?: string;
}

export interface Profile {
  id: string;
  email: string;
  phone?: string;
  full_name: string;
  avatar_url?: string;
  default_role: UserRole;
  expo_push_token?: string;
  is_deleted?: boolean;
  created_at: string;
  updated_at?: string;
}

export interface InstituteMember {
  id: string;
  institute_id: string;
  user_id: string;
  role: UserRole;
  status: MemberStatus;
  verification_status?: VerificationStatus;
  verified_by?: string;
  verified_at?: string;
  joined_at?: string;
  created_at: string;
  institute?: Institute;
  profile?: Profile;
}

export interface Teacher {
  id: string;
  institute_id: string;
  user_id: string;
  teacher_code: string;
  mode?: 'solo' | 'coaching_faculty';
  qualification: string;
  specialization: string;
  specialization_subjects?: string[];
  employee_code?: string;
  experience_years?: number;
  monthly_fee_rate?: number;
  bio?: string;
  achievements?: string;
  demo_video_url?: string;
  joining_date?: string;
  created_at: string;
  profile?: Profile;
}

export interface Student {
  id: string;
  institute_id: string;
  user_id: string;
  roll_number: string;
  admission_number?: string;
  parent_link_code: string;
  class_grade: string;
  grade?: string;
  board?: string;
  target_exam: string;
  school_or_college?: string;
  school_name?: string;
  medium?: string;
  dob?: string;
  blood_group?: string;
  address?: string;
  guardian_name?: string;
  guardian_phone?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  previous_percentage?: string;
  weak_topics?: string[];
  weak_subjects?: string[];
  admission_date?: string;
  is_archived?: boolean;
  parent_id?: string;
  created_at: string;
  profile?: Profile;
}

export interface Parent {
  id: string;
  institute_id: string;
  user_id: string;
  phone?: string;
  occupation?: string;
  alternate_phone?: string;
  relationship_type?: string;
  created_at: string;
  profile?: Profile;
  students?: Student[];
}

export interface ParentStudent {
  id: string;
  institute_id: string;
  parent_id: string;
  student_id: string;
  relationship: string;
  created_at: string;
}

export interface Subject {
  id: string;
  institute_id: string;
  name: string;
  code: string;
  color_hex?: string;
  description?: string;
  created_at: string;
}

export interface Batch {
  id: string;
  institute_id: string;
  name: string;
  subject: string;
  subject_id?: string;
  teacher_id?: string;
  target_exam: string;
  room_number: string;
  start_time: string;
  end_time: string;
  status: 'in_progress' | 'upcoming' | 'completed' | 'archived';
  academic_year?: string;
  start_date?: string;
  end_date?: string;
  is_archived?: boolean;
  student_count: number;
  present_count?: number;
  assigned_teacher_name?: string;
  created_at: string;
  updated_at?: string;
}

export interface BatchTeacher {
  id: string;
  institute_id: string;
  batch_id: string;
  teacher_id: string;
  subject_id?: string;
  created_at: string;
}

export interface BatchStudent {
  id: string;
  institute_id: string;
  batch_id: string;
  student_id: string;
  status: string;
  enrolled_at: string;
}

export interface JoinRequest {
  id: string;
  institute_id: string;
  teacher_id?: string;
  user_id: string;
  requested_role: UserRole;
  code_used: string;
  student_extra_details_json?: Record<string, unknown>;
  status: VerificationStatus;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
}

// ------------------------------------------------------------------------------
// Academic Entities (0002_academic.sql)
// ------------------------------------------------------------------------------

export interface AttendanceRecord {
  id: string;
  institute_id: string;
  batch_id: string;
  student_id: string;
  student_name?: string;
  roll_number: string;
  date: string;
  status: 'P' | 'A' | 'L' | 'E';
  remarks?: string;
  marked_by?: string;
  created_at: string;
  updated_at?: string;
}

export interface AttendanceAuditLog {
  id: string;
  attendance_id: string;
  batch_id: string;
  student_id: string;
  previous_status: string;
  new_status: string;
  changed_by: string;
  reason: string;
  changed_at: string;
}

export interface Lecture {
  id: string;
  institute_id: string;
  batch_id: string;
  subject_id?: string;
  uploaded_by?: string;
  title: string;
  description?: string;
  subject: string;
  provider: 'youtube' | 'direct' | 'bunny';
  video_id_or_url: string;
  duration_minutes: number;
  duration_formatted?: string;
  duration_seconds?: number;
  thumbnail_url?: string;
  faculty_name: string;
  lecture_number?: number;
  is_live?: boolean;
  is_published?: boolean;
  created_at: string;
}

export interface StudyMaterial {
  id: string;
  institute_id: string;
  batch_id?: string;
  subject_id?: string;
  uploaded_by: string;
  category?: 'notes' | 'formula_sheet' | 'pyq' | 'book' | 'dpp' | 'other' | string;
  title: string;
  subject: string;
  description?: string;
  file_url: string;
  file_type: 'pdf' | 'doc' | 'sheet' | string;
  file_size?: string;
  file_size_formatted?: string;
  file_size_bytes?: number;
  download_count?: number;
  page_count?: number;
  created_at: string;
}

export interface AssignmentQuestion {
  id: string;
  prompt?: string;
  question?: string;
  questionText?: string;
  title?: string;
  options?: string[];
  correct_answer?: string;
  correct_option_index?: number;
  explanation?: string;
  marks?: number;
  points?: number;
  [key: string]: unknown;
}

export interface Assignment {
  id: string;
  institute_id: string;
  batch_id: string;
  teacher_id?: string;
  subject_id?: string;
  created_by?: string;
  title: string;
  subject: string;
  instructions: string;
  description?: string;
  type?: AssignmentType;
  questions?: AssignmentQuestion[] | Record<string, unknown>;
  question_paper_url?: string;
  due_date: string;
  due_label: string;
  due_date_formatted?: string;
  total_marks: number;
  max_marks?: number;
  question_count: number;
  attachment_url?: string;
  assigned_by_name?: string;
  created_at: string;
  submission_status?: 'pending' | 'submitted' | 'graded';
  status?: 'pending' | 'submitted' | 'graded';
  submission_count?: number;
  total_students?: number;
}

export interface Submission {
  id: string;
  institute_id?: string;
  assignment_id: string;
  student_id: string;
  student_name: string;
  roll_number: string;
  submission_text?: string;
  answers?: Record<string, unknown>;
  score?: number;
  file_url?: string;
  file_name?: string;
  status: 'submitted' | 'graded' | 'late' | 'resubmit';
  marks_obtained?: number;
  feedback?: string;
  graded_by?: string;
  submitted_at: string;
  submitted_at_formatted?: string;
  graded_at?: string;
  ai_score?: number | null;
  ai_feedback?: string | null;
  ai_status?: 'none' | 'pending_review' | 'suggested' | 'approved' | 'rejected';
  ai_graded_at?: string | null;
}

export interface Examination {
  id: string;
  institute_id: string;
  batch_id: string;
  subject_id?: string;
  title: string;
  exam_date: string;
  max_marks: number;
  passing_marks: number;
  batch_average_marks?: number;
  batch_highest_marks?: number;
  syllabus?: string;
  is_published?: boolean;
  created_at: string;
}

export interface ExamResult {
  id: string;
  institute_id: string;
  examination_id: string;
  student_id: string;
  marks_obtained: number;
  percentage: number;
  batch_rank?: number;
  grade?: string;
  is_absent: boolean;
  remarks?: string;
  recorded_by?: string;
  created_at: string;
}

// ------------------------------------------------------------------------------
// Community & Chat Entities (0003_community_chat.sql)
// ------------------------------------------------------------------------------

export interface ChatRoom {
  id: string;
  institute_id: string;
  batch_id?: string;
  type: 'batch_group' | 'direct_doubt';
  teacher_id: string;
  student_id?: string;
  name: string;
  last_message_text?: string;
  last_message_at?: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  room_id: string;
  sender_id: string;
  sender_role: UserRole;
  message_text?: string;
  attachment_url?: string;
  attachment_type?: 'pdf' | 'image' | 'file';
  attachment_name?: string;
  is_pinned: boolean;
  is_read: boolean;
  created_at: string;
}

export interface CommunityPost {
  id: string;
  institute_id: string;
  batch_id?: string;
  subject_id?: string;
  author_id: string;
  title: string;
  content: string;
  pdf_or_file_url?: string;
  image_url?: string;
  upvotes_count: number;
  is_pinned: boolean;
  is_resolved: boolean;
  created_at: string;
}

export interface CommunityComment {
  id: string;
  institute_id: string;
  post_id: string;
  author_id: string;
  comment_text: string;
  attachment_url?: string;
  is_teacher_verified_answer: boolean;
  created_at: string;
}

export interface CommunityUpvote {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
}

// ------------------------------------------------------------------------------
// Fees, Payments & Notifications (0004_fees.sql)
// ------------------------------------------------------------------------------

export interface FeePlan {
  id: string;
  institute_id: string;
  batch_id?: string;
  name: string;
  amount: number;
  total_amount?: number;
  frequency: 'annual' | 'term' | 'monthly' | 'one_time';
  description?: string;
  created_at: string;
}

export interface StudentFee {
  id: string;
  institute_id: string;
  student_id: string;
  fee_plan_id?: string;
  student_name?: string;
  roll_number?: string;
  title: string;
  total_amount: number;
  paid_amount: number;
  pending_amount: number;
  discount_amount?: number;
  net_payable?: number;
  status: FeeStatus;
  due_date: string;
  due_label?: string;
  created_at: string;
  updated_at?: string;
}

export interface PaymentRecord {
  id: string;
  institute_id: string;
  student_fee_id: string;
  student_id: string;
  student_name?: string;
  amount: number;
  payment_mode: PaymentMode;
  payment_method?: string;
  gst_amount?: number;
  razorpay_payment_id?: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
  receipt_number: string;
  status: PaymentStatus;
  notes?: string;
  recorded_by?: string;
  paid_at: string;
  created_at?: string;
}

export interface Receipt {
  id: string;
  institute_id: string;
  payment_id: string;
  receipt_number: string;
  student_id: string;
  taxable_amount: number;
  gst_rate: number;
  gst_amount: number;
  total_amount: number;
  signed_hash?: string;
  generated_at: string;
}

export interface InAppNotification {
  id: string;
  institute_id: string;
  user_id?: string;
  recipient_id?: string;
  recipient_role?: UserRole | 'all';
  title: string;
  message: string;
  body?: string;
  type: 'attendance' | 'fee' | 'lecture' | 'assignment' | 'broadcast' | 'fee_reminder' | 'general' | string;
  data?: Record<string, unknown>;
  deep_link_data?: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

export interface PushToken {
  id: string;
  user_id: string;
  token: string;
  platform?: string;
  created_at: string;
  updated_at?: string;
}

export interface AnalyticsSummary {
  enrolled_students: number;
  faculty_count: number;
  active_batches: number;
  today_attendance_rate: number;
  present_count: number;
  absent_count: number;
  total_collected_amount: number;
  total_pending_dues: number;
  overdue_students_count: number;
}

export interface Student360Profile {
  id: string;
  /** profiles.id of the student's auth user (students.user_id). */
  userId?: string;
  name: string;
  rollNumber: string;
  grade: string;
  board: string;
  school: string;
  targetExam: string;
  batchName: string;
  parentLinkCode: string;
  guardianName: string;
  guardianPhone: string;
  address: string;
  bloodGroup: string;
  previousPercentage: string;
  weakSubjects: string[];
  overallAttendance: number;
  feeStatus: string;
  rank: number;
  percentile: number;
  teacherRemarks: string[];
}


export interface Announcement {
  id: string;
  institute_id: string;
  batch_id?: string | null;
  author_id: string;
  title: string;
  content: string;
  priority?: 'normal' | 'urgent' | 'high';
  created_at: string;
  updated_at?: string;
  author_name?: string;
  read_count?: number;
  is_read?: boolean;
}

export interface AnnouncementRead {
  announcement_id: string;
  user_id: string;
  read_at: string;
}

export interface ParentStudentLink {
  id: string;
  institute_id: string;
  parent_id: string;
  student_id: string;
  relationship: string;
  student_code_entered?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at?: string;
}


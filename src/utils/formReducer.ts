// AP Course to Subject mapping
function getAPCourseSubject(apCourse: string): string {
  const apSubjectMap: { [key: string]: string } = {
    'AP Biology': 'Science',
    'AP Chemistry': 'Science', 
    'AP Physics 1': 'Science',
    'AP Physics 2': 'Science',
    'AP Physics C: Mechanics': 'Science',
    'AP Physics C: E&M': 'Science',
    'AP Environmental Science': 'Science',
    'AP Calculus AB': 'Math',
    'AP Calculus BC': 'Math',
    'AP Statistics': 'Math',
    'AP English Language & Composition': 'English Language Arts',
    'AP English Literature & Composition': 'English Language Arts', 
    'AP World History': 'Social Studies',
    'AP US History': 'Social Studies',
    'AP European History': 'Social Studies',
    'AP Government & Politics': 'Social Studies',
    'AP Economics (Macro)': 'Social Studies',
    'AP Economics (Micro)': 'Social Studies',
    'AP Psychology': 'Social Studies',
    'AP Art History': 'Art',
    'AP Computer Science A': 'Computer Science',
    'AP Computer Science Principles': 'Computer Science'
  }
  
  return apSubjectMap[apCourse] || ''
}

// College Board Course & Exam Description (CED) data
export interface APCourseData {
  course: string
  subject: string
  units: Array<{
    number: number
    title: string
    examWeight: string
    essentialQuestions: string[]
    learningObjectives: string[]
    skills: string[]
  }>
  examSkills: Array<{
    category: string
    skills: Array<{
      code: string
      description: string
    }>
  }>
  examFormat: {
    multipleChoice: {
      questions: number
      timeMinutes: number
      weight: string
    }
    freeResponse: {
      questions: number
      timeMinutes: number
      weight: string
      types: string[]
    }
  }
  collegeLevelTasks: string[]
  scaffoldedProgression: {
    earlyYear: string[]
    midYear: string[]
    lateYear: string[]
  }
}

export function getAPCourseData(apCourse: string): APCourseData | null {
  // This will be expanded with full CED data for each course
  const apCourseDatabase: { [key: string]: APCourseData } = {
    'AP US History': {
      course: 'AP US History',
      subject: 'Social Studies',
      units: [
        {
          number: 1,
          title: 'Period 1: 1491-1607',
          examWeight: '4-6%',
          essentialQuestions: [
            'How did the contact between Europeans and Native Americans change both societies?',
            'How did the environment shape the development of different societies?'
          ],
          learningObjectives: [
            'KC-1.1.I.A: Explain how environmental factors shaped different Native American societies',
            'KC-1.1.I.B: Explain how contact between Europeans and Native Americans affected both groups'
          ],
          skills: ['Skill 1.A: Developments and processes', 'Skill 2.B: Explain how historical evidence supports an argument']
        },
        {
          number: 3,
          title: 'Period 3: 1754-1800',
          examWeight: '10-17%',
          essentialQuestions: [
            'How did British policies ignite revolution?',
            'How did revolutionary ideals influence the new nation?'
          ],
          learningObjectives: [
            'KC-3.1.I: Explain the causes of the American Revolution',
            'KC-3.2.I: Explain how the American Revolution affected society'
          ],
          skills: ['Skill 3.A: Analyze historical evidence', 'Skill 4.A: Craft historical arguments']
        }
      ],
      examSkills: [
        {
          category: 'Analyzing Historical Evidence',
          skills: [
            { code: 'Skill 2.A', description: 'Analyze the purposes of and audiences for historical sources' },
            { code: 'Skill 2.B', description: 'Explain how historical evidence supports an argument' }
          ]
        },
        {
          category: 'Crafting Historical Arguments',
          skills: [
            { code: 'Skill 4.A', description: 'Craft historical arguments from historical evidence' },
            { code: 'Skill 4.B', description: 'Support an argument using specific and relevant evidence' }
          ]
        }
      ],
      examFormat: {
        multipleChoice: {
          questions: 55,
          timeMinutes: 55,
          weight: '40%'
        },
        freeResponse: {
          questions: 4,
          timeMinutes: 100,
          weight: '60%',
          types: ['Document-Based Question (DBQ)', 'Long Essay Question (LEQ)', 'Short Answer Questions (SAQ)']
        }
      },
      collegeLevelTasks: [
        'Thesis-driven historical arguments using primary source evidence',
        'Document analysis with HIPP (Historical context, Intended audience, Purpose, Point of view)',
        'Comparative historical analysis across time periods',
        'Causation and continuity/change over time essays',
        'Primary source document contextualization and synthesis'
      ],
      scaffoldedProgression: {
        earlyYear: [
          'Teacher-modeled document analysis with guided practice',
          'Structured thesis writing templates and feedback',
          'Collaborative primary source investigation with scaffolds'
        ],
        midYear: [
          'Independent document analysis with peer review',
          'Timed writing practice with self-assessment rubrics',
          'Student-led historical debates with evidence requirements'
        ],
        lateYear: [
          'Self-directed research projects with college-level expectations',
          'Mock exam conditions with authentic time constraints',
          'Independent historical investigation and argument construction'
        ]
      }
    },
    'AP Biology': {
      course: 'AP Biology',
      subject: 'Science',
      units: [
        {
          number: 1,
          title: 'Chemistry of Life',
          examWeight: '8-11%',
          essentialQuestions: [
            'How do the chemical and physical properties of water and carbon allow them to support life?',
            'How do biological macromolecules support life processes?'
          ],
          learningObjectives: [
            'BIO-1.A: Describe the properties of water that make it suitable for biological processes',
            'BIO-1.B: Describe the structure and function of biological macromolecules'
          ],
          skills: ['Science Practice 2: Data Analysis', 'Science Practice 4: Scientific Reasoning']
        }
      ],
      examSkills: [
        {
          category: 'Scientific Investigation',
          skills: [
            { code: 'Science Practice 1', description: 'Concept Explanation' },
            { code: 'Science Practice 2', description: 'Visual Representations' }
          ]
        }
      ],
      examFormat: {
        multipleChoice: {
          questions: 60,
          timeMinutes: 90,
          weight: '50%'
        },
        freeResponse: {
          questions: 6,
          timeMinutes: 90,
          weight: '50%',
          types: ['Long Free Response (2 questions)', 'Short Free Response (4 questions)']
        }
      },
      collegeLevelTasks: [
        'Lab reports with full methodology, data analysis, and error analysis',
        'Scientific paper analysis and critique',
        'Experimental design with hypothesis formation and variable identification',
        'Data interpretation with statistical analysis',
        'Scientific model construction and evaluation'
      ],
      scaffoldedProgression: {
        earlyYear: [
          'Guided lab procedures with structured data collection',
          'Teacher-modeled scientific reasoning and explanation',
          'Collaborative experimental design with templates'
        ],
        midYear: [
          'Independent lab execution with peer collaboration',
          'Self-directed data analysis with instructor feedback',
          'Student-designed modifications to existing experiments'
        ],
        lateYear: [
          'Original experimental design and implementation',
          'Independent research literature review and synthesis',
          'Scientific presentation and peer evaluation'
        ]
      }
    }
  }
  
  return apCourseDatabase[apCourse] || null
}

export interface FormState {
  [key: string]: any // Index signature for compatibility with Record<string, unknown>
  // Mode states
  isSubMode: boolean
  showActivityCreation: boolean
  showPreview: boolean
  
  // Activity creation states
  selectedDate: string
  gradeLevel: string
  subject: string
  lessonTopic: string
  activityType: string
  customActivityType: string
  showCustomInput: boolean
  
  // Sub mode specific states
  substituteName: string
  techPassword: string
  emergencyContacts: string
  
  // Optional enhancement states
  duration: string
  classSize: string
  specialNotes: string
  showAdvancedOptions: boolean
  
  // Intelligence states
  intelligenceProcessing: boolean
  aiProcessing: boolean
  processing: boolean
  generatedActivityId: string
  generatedActivity: string | null
  topic: string
  
  // Preview modal states
  expandedSections: { [key: string]: boolean }
  completedPhases: { [key: number]: boolean }
  feedback: string
  error: string | null
}

export type FormAction = 
  | { type: 'SET_SUB_MODE'; payload: boolean }
  | { type: 'SET_SHOW_ACTIVITY_CREATION'; payload: boolean }
  | { type: 'SET_SHOW_PREVIEW'; payload: boolean }
  | { type: 'SET_SELECTED_DATE'; payload: string }
  | { type: 'SET_GRADE_LEVEL'; payload: string }
  | { type: 'SET_SUBJECT'; payload: string }
  | { type: 'SET_LESSON_TOPIC'; payload: string }
  | { type: 'SET_ACTIVITY_TYPE'; payload: string }
  | { type: 'SET_CUSTOM_ACTIVITY_TYPE'; payload: string }
  | { type: 'SET_SHOW_CUSTOM_INPUT'; payload: boolean }
  | { type: 'SET_SUBSTITUTE_NAME'; payload: string }
  | { type: 'SET_TECH_PASSWORD'; payload: string }
  | { type: 'SET_EMERGENCY_CONTACTS'; payload: string }
  | { type: 'SET_DURATION'; payload: string }
  | { type: 'SET_CLASS_SIZE'; payload: string }
  | { type: 'SET_SPECIAL_NOTES'; payload: string }
  | { type: 'SET_SHOW_ADVANCED_OPTIONS'; payload: boolean }
  | { type: 'SET_PROCESSING'; payload: boolean }
  | { type: 'SET_INTELLIGENCE_PROCESSING'; payload: boolean }
  | { type: 'SET_GENERATED_ACTIVITY_ID'; payload: string }
  | { type: 'SET_GENERATED_ACTIVITY'; payload: string | null }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'SET_EXPANDED_SECTIONS'; payload: { [key: string]: boolean } }
  | { type: 'TOGGLE_SECTION'; payload: string }
  | { type: 'SET_COMPLETED_PHASES'; payload: { [key: number]: boolean } }
  | { type: 'TOGGLE_PHASE'; payload: number }
  | { type: 'SET_FEEDBACK'; payload: string }
  | { type: 'TOGGLE_MODE' }
  | { type: 'RESET_FORM' }

export const initialFormState: FormState = {
  // Mode states
  isSubMode: false,
  showActivityCreation: false,
  showPreview: false,
  
  // Activity creation states
  selectedDate: '',
  gradeLevel: '',
  subject: '',
  lessonTopic: '',
  activityType: '',
  customActivityType: '',
  showCustomInput: false,
  
  // Sub mode specific states
  substituteName: '',
  techPassword: '',
  emergencyContacts: '',
  
  // Optional enhancement states
  duration: '50',
  classSize: '',
  specialNotes: '',
  showAdvancedOptions: false,
  
  // Intelligence states
  intelligenceProcessing: false,
  aiProcessing: false,
  processing: false,
  generatedActivityId: '',
  generatedActivity: null,
  topic: '',
  
  // Preview modal states
  expandedSections: {
    overview: true,
    instructions: true,
    differentiation: false,
    assessment: false,
    management: false
  },
  completedPhases: {},
  feedback: '',
  error: null
}

export function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'SET_SUB_MODE':
      return { ...state, isSubMode: action.payload }
    case 'SET_SHOW_ACTIVITY_CREATION':
      return { ...state, showActivityCreation: action.payload }
    case 'SET_SHOW_PREVIEW':
      return { ...state, showPreview: action.payload }
    case 'SET_SELECTED_DATE':
      return { ...state, selectedDate: action.payload }
    case 'SET_GRADE_LEVEL':
      // Auto-set subject for AP courses to streamline form flow
      const newState = { ...state, gradeLevel: action.payload }
      
      // Extract subject from AP course name
      if (action.payload.startsWith('AP ')) {
        const apSubject = getAPCourseSubject(action.payload)
        if (apSubject) {
          newState.subject = apSubject
        }
      } else {
        // Clear subject if switching from AP to regular grade level
        if (state.gradeLevel.startsWith('AP ') && !action.payload.startsWith('AP ')) {
          newState.subject = ''
        }
      }
      
      return newState
    case 'SET_SUBJECT':
      return { ...state, subject: action.payload }
    case 'SET_LESSON_TOPIC':
      return { ...state, lessonTopic: action.payload }
    case 'SET_ACTIVITY_TYPE':
      return { ...state, activityType: action.payload }
    case 'SET_CUSTOM_ACTIVITY_TYPE':
      return { ...state, customActivityType: action.payload }
    case 'SET_SHOW_CUSTOM_INPUT':
      return { ...state, showCustomInput: action.payload }
    case 'SET_SUBSTITUTE_NAME':
      return { ...state, substituteName: action.payload }
    case 'SET_TECH_PASSWORD':
      return { ...state, techPassword: action.payload }
    case 'SET_EMERGENCY_CONTACTS':
      return { ...state, emergencyContacts: action.payload }
    case 'SET_DURATION':
      return { ...state, duration: action.payload }
    case 'SET_CLASS_SIZE':
      return { ...state, classSize: action.payload }
    case 'SET_SPECIAL_NOTES':
      return { ...state, specialNotes: action.payload }
    case 'SET_SHOW_ADVANCED_OPTIONS':
      return { ...state, showAdvancedOptions: action.payload }
    case 'SET_PROCESSING':
      return { ...state, intelligenceProcessing: action.payload }
    case 'SET_INTELLIGENCE_PROCESSING':
      return { ...state, intelligenceProcessing: action.payload }
    case 'SET_GENERATED_ACTIVITY_ID':
      return { ...state, generatedActivityId: action.payload }
    case 'SET_GENERATED_ACTIVITY':
      return { ...state, generatedActivity: action.payload }
    case 'SET_EXPANDED_SECTIONS':
      return { ...state, expandedSections: action.payload }
    case 'TOGGLE_SECTION':
      return {
        ...state,
        expandedSections: {
          ...state.expandedSections,
          [action.payload]: !state.expandedSections[action.payload]
        }
      }
    case 'SET_COMPLETED_PHASES':
      return { ...state, completedPhases: action.payload }
    case 'TOGGLE_PHASE':
      return {
        ...state,
        completedPhases: {
          ...state.completedPhases,
          [action.payload]: !state.completedPhases[action.payload]
        }
      }
    case 'SET_FEEDBACK':
      return { ...state, feedback: action.payload }
    case 'SET_ERROR':
      return { ...state, error: action.payload }
    case 'TOGGLE_MODE':
      return { ...state, isSubMode: !state.isSubMode }
    case 'RESET_FORM':
      return {
        ...initialFormState,
        selectedDate: state.selectedDate, // Keep the date
        isSubMode: state.isSubMode // Keep the mode
      }
    default:
      return state
  }
}
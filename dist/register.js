function pipe (...fns) {
  return arg => fns.reduce((acc, f) => f(acc), arg)
}
function nameTemplate (sep = '') {
  return ({ userName = '', userCode = ''} = {}) => `${userCode}${sep}${userName}`
}

// 시트 정보
const sheets = {
  dbSheet: "DB form", // 스케줄 시트 폼
  scoreSheetForm: "score form", // 스코어 시트 폼
  seriesMapData: '시리즈세트' // 시리즈 데이터 
}
// 시트나 폴더의 아이디
const location = {
  focusRoot: '1wmofJHo6jLVqmn3KmDu1N1YE_DXSMJu9', // 슈퍼클리닉 포커스 루트 폴더
  sourceFolder: '11nGN85Bo3ZVcV6pDbSAQSzBUrlcq4KFn', // 슈퍼클리닉 진단 문제 폴더
  courseId: '450939166434', // 지성 슈퍼클리닉 courseId
  answerLink: 'https://docs.google.com/forms/d/e/1FAIpQLSfQOHBApBKn4-HkEKYrrj3djgVAt0PfTl2bOe5E4dHYxHGw8Q/viewform', // 답안 설문 링크
  scoreSpreadsheet: '146iZVMnTPuSK4XA6gr7fozAMs_BIhMhDQ0UsbYEsj7k', // 점수 저장 스프레드 시트
  seriesMapSheet: '1RpKzx0EO2uZC6BHgJ202ExldYmNDj0mq209ktxYAXAk', // 시리즈 맵 시트
  scheduleSheet: '1pGXFRqjy26yuBocYl8Ryl2okhsbYac91msBsNOwsad4', // 개인 스케줄 시트 아이디
  classScheduleSheet: '1TrlMraLXD-5E-6kSRgmLibx7Yo-3L3gSFK-zIjn-1Lw', // 클래스 스케줄 모아 놓은 시트
  classHomeworkSheet: '1WJYHTak-xkhsTMmdoOv-RDVjEjazGWfbIyuHp5lMbgk', // 클래스 homework 시트
  classStudentsSheet: '1U8d3NAyAEMOeKJw0uiuaXqIt9xYMrd1ns0RGzS9HcsY', // 클래스 학생 모아 놓은 시트
}

// 폴더 이름 만들기
const makeUserFolderName = nameTemplate('_')

// 시작 폴더 찾기
const getRootFolder = function () {
  return DriveApp.getFolderById(location.focusRoot)
}
function linkFolderName (userCode = '', userName = '') {
  return `${userCode}_${userName}`
}
// 시작 폴더 아래 사용자 폴더 만들기
// 사용자 코드와 사용자 이름을 변수로 받아서 폴더를 만들고 그 폴더를 리턴
function makeFirstFolder (student = new Student(), rootFolder) {
  // 사용자 폴더가 있는지 확인하기
  // root폴더의 파일 이터레이터를 받아서 이름이 있는 지 체크하는 함수
  const folderName = linkFolderName(student.userCode(), student.userName())
  // folderName을 받고 폴더 이터레이터를 받아서 이름이 있는지 검사하는 함수
  const isSameName = (folderName, folderIter) => {
    while(folderIter.hasNext()) {
      const folder = folderIter.next()
      if (folder.getName() === folderName) {
        return true
      }
    }
    return false
  }  
  if(!isSameName(folderName, rootFolder.getFolders())) {
    rootFolder.createFolder(folderName)
    return `${student.userName()}의 폴더를 생성하였습니다.`
  } else return      
}
/**
 * 사용자 시트 만들기
 */

//탭 네임 만들기
const makeSheetName = nameTemplate('-')
function getSpreadsheet () {
  return SpreadsheetApp.openById(location.scheduleSheet)   
} 
function initiateSheet (student = new Student(), registerStudents) {
  const sheetTabName = [student.userCode(), student.userName()].join('-')
  const nameCheck = (sheetName = '') => {
    return sheetTabName === sheetName
  }
  const isSheetAlready = (registeredUsers) => {
    console.log(student.userName())
    return registerStudents.some(nameCheck)    
  }
  // 사용자 이름과 사용자 코드 -> 새로운 사용자 시트 만들기
  const makeUserSheet = () => {
    const spreadsheet = getSpreadsheet()
    const dbSheet = spreadsheet.getSheetByName(sheets.dbSheet)
    spreadsheet.insertSheet(sheetTabName, 1, {template: dbSheet})
    return `${student.userName()}을 위한 시트를 생성했습니다.`
  }
  const main = () => {
    if (isSheetAlready(registerStudents)) return
    else makeUserSheet()
  }
  main()
}

// 사용자 이름과 사용자 코드 받아서 사용자 시트 지우는 함수
const deleteUserSheet = function ({ userName = '', userCode = '' } = {}) {
  const ss = SpreadsheetApp.openById(location.scheduleSheet)
  const target = ss.getSheetByName(makeSheetName({ userName, userCode }))
  ss.deleteSheet(target)
}
// course의 정보를 모으는 함수를 객체로 모으기
const Course = {
  // workType
  setWorkType() {
    const workType = "ASSIGNMENT"
    this.template = { ...this.template, workType }
    return this
  },
  // assigneeMode
  setAssigneeMode() {
    const assigneeMode = "INDIVIDUAL_STUDENTS"
    this.template = { ...this.template, assigneeMode }
    return this
  },
  // state
  setState () {
    const state = "PUBLISHED"
    this.template = { ...this.template, state }
    return this
  },
  // individualStudentsOptions
  setIndividualStudentsOptions (student = new Student()) {
    const individualStudentsOptions = {}
    individualStudentsOptions.studentIds = [student.studentId().toString()]
    this.template = { ...this.template, individualStudentsOptions }
    return this
  },
  // studentId check 
  checkStudentId () {
    // studentId 있는 지 확인
    const template = this.template
    if(!template.individualStudentsOptions) {
      console.log('1')
      return false
    } else if (!template.individualStudentsOptions.studentIds) {
      console.log('2')
      return false
    } else if (template.individualStudentsOptions.studentIds.length <= 0) {
      console.log('3')
      return false
    } else {
      console.log('student Id 검사 통과')
      return true
    }  
  },
  setTopic (student = new Student()) {
    const topicId = student.topicId().toString()
    this.template = { ...this.template, topicId }
    return this   
  },
  setDescription (student = new Student()) {
    const description = `${student.userName()} 학생
    기관코드: 1191, 사용자코드: ${student.userCode()}
    시험코드는 교재에 있는 다섯자리 또는 여섯자리 코드를 입력해주세요 (예: , 16040, 109110)
    자신이 답안을 입력하면 잠시 뒤에 해설을 확인할 수 있습니다.`
    this.template = { ...this.template, description }
    return this  
  },
  setMaterial () {
    const materials = []
    materials[0] = { "link": { url: location.answerLink} }
    this.template = { ...this.template, materials }
    return this
  },
  // title 만들기
  setTitle (student = new Student()) {
    const makeDateForToday = () => {
      const today = new Date()
      const [year, month, date] = [today.getFullYear(), today.getMonth() + 1, today.getDate()]
      return [year, month, date].join('-');
    };
    const title = `${makeDateForToday()} ${student.userName()} 학생 슈퍼클리닉 포커스 입니다.`
    this.template = { ...this.template, title }
    return this
  },
  makeCourseWork (student = new Student()) {
    Classroom.Courses.CourseWork.create(this.template, student.courseId())
  }  
}
// courseWork obj 만들기
function makeCourseTemplate (student = new Student()) {
  const courseTemplate = Object.create(Course)
  courseTemplate.template = {}
  courseTemplate
    .setWorkType()
    .setAssigneeMode()
    .setState()
    .setMaterial()
    .setTitle(student)
    .setTopic(student)
    .setIndividualStudentsOptions(student)
    .setDescription(student)  
  console.log(courseTemplate.template)
  return courseTemplate
}
// courseWork 만들기
function makeCourseWorkList () {
  const courseWorkListById = courseIds()
    .map(courseId => 
      ({ [courseId]: Classroom.Courses.CourseWork.list(courseId).courseWork}))
    .reduce((prev, curr) => ({ ...prev, ...curr}) ,{})
  return courseId => courseWorkListById[courseId]
}
function registerStudents () {
  const startFolder = getRootFolder()
  const spreadsheet = getSpreadsheet()
  const registeredUsers = spreadsheet
    .getSheets()
    .map(sheet => sheet.getSheetName())
    .slice(1)
  return  getStudents()
    //.filter(student => student.education().trim() === '지성재종')
    .filter(student => student.userCode())
    .forEach(student => {
      makeFirstFolder(student, startFolder)
      initiateSheet(student, registeredUsers)
    })  
}
function introduceFocus () {
  const getCourseWorkList = makeCourseWorkList()
  const makeCourseWork = (student = new Student()) => {
    const studentOwnCourseWork = (student = new Student()) => {
      const topicId = getCourseWorkList(student.courseId().toString())
        .find(courseWork => {
          //console.log('topicId:', courseWork.topicId)
          if(courseWork) {
            return courseWork.topicId === student.topicId()
          }
          
        }) 
      return !topicId ? false : true
    }
    if (studentOwnCourseWork(student)) {
      console.log(`${student.userName()}은 이미 시작했습니다.`)
      return
    }
    const courseTemplate = makeCourseTemplate(student)
    if(courseTemplate.checkStudentId()) {
      console.log('학생 아이디 있음')
      try{
        courseTemplate.makeCourseWork(student)
        console.log(`${student.userName()}을 위한 첫번째 클래스룸을 개설하였습니다.`)
      } catch (err) {
        console.error(err)
        return err
      }
    } 
    else {
      console.log(`${userInfo.userName}이 아직 클래스룸에 입장하지 않았습니다.`)
    }
  
  }
  return  getStudents()
    //.filter(student => student.education().trim() === '지성재종')
    .filter(student => student.studentId())
    .forEach(student => {
      const resultMessage = makeCourseWork(student)
      console.log(resultMessage)
    })
}
function initateFocus () {
  registerStudents()
  introduceFocus()
}


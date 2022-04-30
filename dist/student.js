
function getClassRoomInfo (email = '5221029kim@gmail.com') {
  const getStudentsInfo = () => 
    courseIds()
      .map(courseId => 
        Classroom.Courses.Students.list(courseId).students)
      .flat()
    
  const iter = (studentInfo) => {
    if(studentInfo.length === 0) return
    
    if(typeof studentInfo == 'object' && !Array.isArray(studentInfo)) {
      return Promise.resolve(studentInfo)
        .then(studentInfo => {
          const { profile } = studentInfo
          //console.log(profile.emailAddress)
          if(profile.emailAddress == email) return studentInfo
        })
        .catch(err => console.error(err))
    }

    if(Array.isArray(studentInfo)){
      return Promise.resolve(studentInfo)
      .then(async studentInfo => {
        console.log(studentInfo.length)
        result = await iter(studentInfo[0])
        if(result) return result 
        else throw studentInfo.slice(1) 
      })
      .catch(studentInfo => {
        return iter(studentInfo)
      })
    }   
  }
  iter(getStudentsInfo()).then(student => console.log(student))  
}
function courseIds () {
  return [
    '474837742176',
    '450939166434',
    '145466970282',
    '66610519273'
  ]
}
function makeStudentList (courseIds) {
  const list = courseIds.map(courseId => {
    const courseStudents = Object.create(null)
    courseStudents[courseId] = Classroom.Courses.Students.list(courseId).students
    return courseStudents
  })
  return courseId => {
    for (const students of list) {
      if (students[courseId]) {
        //console.log(students[courseId])
        return students[courseId]
      }
    }
    return 
  }
}

function getCurrentSheet (sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet()
  return ss.getSheetByName(sheetName)
}  

function getStudents () {
  const sheet = getCurrentSheet(SHEET_NAME)
  return sheet.getDataRange()
    .getValues()
    .slice(1)
    .map(row => new Student(row))
}


/**
 * 학생 확인
 */
const SHEET_NAME = 'Student Form'
class Student {
  education () {
    return this.data[11]
  }
  userName () {
    return this.data[1]
  }
  userCode () {
    return this.data[0].toString()
  }
  emailAddress () {
    return this.data[4]
  }
  courseId () {
    if (this.data[9]) return this.data[9].toString()
  }
  studentId () {
    return this.data[5].toString()
  }
  setStudentId (studentId) {
    this.data[5] = studentId
  }
  topicId () {
    return this.data[6].toString()
  }
  invitationCheck () {
    return this.data[7] == 1 ? true : false
  }
  approvalCheck () {
    return this.data[8] == 1 ? true : false
  }
  changeApproval () {
    this.data[8] = 1
  }
  getCell() {
    const sheet = getCurrentSheet(SHEET_NAME)
    const table = sheet.getDataRange().getValues()
    const findRow = () => table.findIndex(data => data[4] === this.emailAddress()) + 1
    
    return column => sheet.getRange(findRow(), column)
  }
  rangeForApproval () {
    const COLUMN_APPROVAL = 9
    return this.getCell()(COLUMN_APPROVAL)
  }
  rangeForUserCode () {
    const COLUMN_USERCODE = 1
    return this.getCell()(COLUMN_USERCODE)
  }
  rangeForInvitation () {
    const COLUMN_INVITATION = 8
    return this.getCell()(COLUMN_INVITATION)
  }
  rangeForStudentId () {
    const COLUMN_STUDENT_ID = 6
    return this.getCell()(COLUMN_STUDENT_ID)
  }
  rangeForTopicId () {
    const COLUMN_TOPIC_ID = 7
    return this.getCell()(COLUMN_TOPIC_ID)
  }
  constructor(row = []) {
    this.data = row
  }
}

/**
 * 학생들 리스트를 만들어서 코스에 따라 나누어 주는 함수를 리턴하는 함수
 */
function findStudent () {
  const studentLists = makeStudentList(courseIds())
  
  const changeStatusSheet = (aStudent) => {
    aStudent.rangeForApproval().setValue(1)
  }
  const notify = (aStudent) => {
    const NOTIFICATION = '#ffff00'
    aStudent.rangeForUserCode().setBackground(NOTIFICATION)
  }
  const checkApprovalClassroom = (aStudent) => {
    const students = studentLists(aStudent.courseId())
    console.log(aStudent.userName(), typeof aStudent.courseId())
    return students.findIndex(student => 
      student.profile.emailAddress.toLowerCase() === aStudent.emailAddress().toLowerCase()) > -1
  }
  const requestCheck = (aStudent) => {
    const NOTIFICATION = '#ffff00'
    return aStudent.rangeForUserCode().getBackground() === NOTIFICATION
  }
  // 학생 초대하기
  const invite = (aStudent) => {
    const makeInvitation = () => {
      const userId = aStudent.emailAddress()
      const courseId = aStudent.courseId().toString()
      const role = 'STUDENT'
      return { userId, courseId, role }
    }
    const result = Classroom.Invitations.create(makeInvitation())
    if(result) return iter(aStudent, 1)
    else return
  }


  const iter = (aStudent, trial) => {
    if (requestCheck(aStudent) || (aStudent.approvalCheck() && aStudent.userCode())) {
      return
    }
    if (aStudent.invitationCheck() && trial === 0) {
      return aStudent.approvalCheck() ? notify(aStudent) : iter(aStudent, 1)
    }
    if (aStudent.invitationCheck() && trial === 1) {
      //console.log(aStudent.userName())
      if (checkApprovalClassroom(aStudent)) {
        changeStatusSheet(aStudent)
        aStudent.changeApproval()
        return iter(aStudent, 0)
      } else return 
    }
    if (!aStudent.invitationCheck() && trial === 0) {
      try {
        if(aStudent.emailAddress()) invite(aStudent)
      } catch (err) {
        console.log(aStudent.userName())
        console.error(err)
      }
      return
    }
    if (!aStudent.invitationCheck() && trial === 1) {
      aStudent.rangeForInvitation().setValue('1')
      return 
    }
    return   
  }
  getStudents().forEach(student => iter(student, 0))
}
/**
 * update studentId, topicId
 */
function updateClassroomId(aStudent, studentLists) {
  const updateStudentId = (aStudent) => {
    const studentId = studentLists(aStudent.courseId())
      .find(student => 
        student.profile.emailAddress.toLowerCase() === aStudent.emailAddress().toLowerCase())
    .userId
    if(studentId) aStudent.rangeForStudentId().setValue(studentId)
    return studentId
  }
  const makeTopic = (aStudent) => {
    const topicName = `${aStudent.userCode()} ${aStudent.userName()} 학생`
    const item = { name: topicName }
    const topic = Classroom.Courses.Topics.create(item, aStudent.courseId())
    if (topic) {
      aStudent.rangeForTopicId().setValue(topic.topicId)
      return
    }
    else return 
  }
  const run = () => {
    if (!aStudent.approvalCheck() || !aStudent.userCode()) return 
    if (!aStudent.studentId()) {
      const studentId = updateStudentId(aStudent)
      aStudent.setStudentId(studentId)
      return run()
    }
    if (!aStudent.topicId()) {
      makeTopic(aStudent)
      return
    }
  }
  run()
}
function startFocus () {
  const studentLists = makeStudentList(courseIds())    
  const students = getStudents()
  students.forEach(student => {
    console.log(student.userName())
    updateClassroomId(student, studentLists)
  })
  return initateFocus()
}

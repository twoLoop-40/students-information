function createMenu () {
  return SpreadsheetApp.getUi()
    .createMenu('슈퍼 클리닉')
    .addItem('신규 학생 찾기','findStudent')
    .addItem('포커스 시작하기', 'startFocus')
    .addToUi()
}
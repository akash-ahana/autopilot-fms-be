function CurrentIST() {
    return new Date().setHours(new Date().getHours() + 5, new Date().getMinutes() + 30);
  }

  function CurrentISTaddHrs() {
    return new Date().setHours(new Date().getHours() + 5, new Date().getMinutes() + 30);
  }



  module.exports = { CurrentIST, CurrentISTaddHrs };
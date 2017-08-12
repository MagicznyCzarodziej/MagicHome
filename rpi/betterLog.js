//Better console logging
var counter = 1;
var lastLog = "";

module.exports =  function logUpdate(text) {
  if(text == lastLog){
    counter++;
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write(text + " | x" + counter);
  }else{
    counter = 1;
    process.stdout.write("\n" + text);
  }
  lastLog = text;
}

var storageKey = 'list';
var socket = io();
var list = [];
var listString = '';

var htmlList = document.getElementById("history");

function convertToHTML(list){
  var content = list.map(function(item){
    return `
    <div class="item">
      <div class="item-content">Time: ${item.TimeStamp}</div>
      <div class="item-content">Outside:</div>
      <div class="item-content-small">Lux: ${item.OutsideLux}</div>
      <div class="item-content-small">Temp: ${item.OutsideTemp}</div>
      <div class="item-content">Inside:</div>
      <div class="item-content-small">Lux: ${item.InsideLux}</div>
      <div class="item-content-small">Temp: ${item.InsideTemp}</div>
      <div class="item-content">Servo: ${item.Servo}</div>
    </div>`;
  });
  return content;
}
function statusHTML(item){
  return `
  <div class="item">
    <div class="item-content">Time: ${item.TimeStamp}</div>
    <div class="item-content">Outside:</div>
    <div class="item-content-small">Lux: ${item.OutsideLux}</div>
    <div class="item-content-small">Temp: ${item.OutsideTemp}</div>
    <div class="item-content">Inside:</div>
    <div class="item-content-small">Lux: ${item.InsideLux}</div>
    <div class="item-content-small">Temp: ${item.InsideTemp}</div>
  </div>`;
}
function render(){
  var content = convertToHTML(list);
  htmlList.innerHTML = content.join('');
}
render();

$("#arc-slider").roundSlider({
  sliderType: "min-range",
  circleShape: "custom-quarter",
  value: 30,
  min:-90,
  max: 90,
  startAngle: 45,
  editableTooltip: true,
  radius: 240,
  width: 6,
  handleSize: "+32",
  tooltipFormat: function (args) {
      return args.value + '&#176;';
  }
});
var btnSubmit = document.getElementById("btn-submit");
btnSubmit.addEventListener("click", ()=>{
  // var socket = io();
  var servoString = document.getElementsByClassName("edit")[0].textContent.replace("°","");
  console.log(servoString);
  socket.emit('postDataServo', servoString);
  // $.post('/',
  //       { servo: servoString })
  //       .done(function() { console.log('Request done!'); })
  //       .fail(function () { console.log('Request Fail!')});
});


$(function() {
  $('.set-servo-manual').hide() 
  $('#set-mode').change(function() {
    if ($(this).prop('checked'))
      $('.set-servo-manual').hide()
    else $('.set-servo-manual').show()
  })
})

$(function() { 
  $("td").click(function(){
    if($(this).hasClass('bg-green')){
      $(this).removeClass('bg-green');
    }
    else $(this).addClass('bg-green');
});
})

socket.on("sendDataOutside",(data) => {
      console.log(data);
      // var data = JSON.parse(dataString);
      list.unshift(data);
      
      if (list.length > 3) 
        list.pop();
      
      document.getElementById("info-status").innerHTML = statusHTML(data);
      render();
    })
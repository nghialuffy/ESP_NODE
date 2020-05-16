var storageKey = 'list';

var list = [];
var listString = '';

function Item(time,insideLux,insideTemp,outsideLux,outsideTemp,servo){
    this.time = time;
    this.insideLux = insideLux;
    this.insideTemp = insideTemp;
    this.outsideLux = outsideLux;
    this.outsideTemp = outsideTemp;
    this.servo = servo;
}
var item1 = new Item('16:30 30/04/2020',30,25,150,25,30);
var item2 = new Item('16:30 30/04/2020',30,25,150,25,30);
var item3 = new Item('16:30 30/04/2020',30,25,150,25,30);

list.push(item1);
list.push(item2);
list.push(item3);

listString = JSON.stringify(list);
localStorage.setItem(storageKey,listString);

function convertToHTML(list){
  var content = list.map(function(item){
    return `
    <div class="item">
      <div class="item-content">Time: ${item.time}</div>
      <div class="item-content">Outside:</div>
      <div class="item-content-small">Lux: ${item.outsideLux}</div>
      <div class="item-content-small">Temp: ${item.outsideTemp}</div>
      <div class="item-content">Inside:</div>
      <div class="item-content-small">Lux: ${item.insideLux}</div>
      <div class="item-content-small">Temp: ${item.insideTemp}</div>
      <div class="item-content">Servo: ${item.servo}</div>
    </div>`;
  });
  return content;
}
function render(){
  var htmlList = document.getElementById('history');
  listString = localStorage.getItem(storageKey);
  if (listString){
    list = JSON.parse(listString);
    var content = convertToHTML(list);
    htmlList.innerHTML = content.join('');
  }
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
  var servoString = document.getElementsByClassName("edit")[0].textContent.replace("°","");
  $.get('/data.txt',  // url
      function (data, textStatus, jqXHR) {  // success callback
          alert('status: ' + textStatus + ', data:' + data);
    });
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


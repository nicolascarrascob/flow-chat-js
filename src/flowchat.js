"use strict";
(function( $ ) {

  var objectSearch = {};
  $.fn.flowchat = function( options ) {

    // override options with user preferences

    var settings = $.extend({
      delay: 1500,
      startButtonId: '#startButton',
      autoStart: true,
      startMessageId: 1,
      dataJSON: null
    }, options );

    var container = $(this);

    $(function() {
      if(settings.autoStart)
        startChat(container, settings.dataJSON, settings.startMessageId, settings.delay)
    });

    // on click of Start button
    $(document).on('click', settings.startButtonId, function() {

      startChat(container, settings.dataJSON, settings.startMessageId, settings.delay)

    });
  }

  function selectOption($this, container, data, delay) {
    $this.parent().hide();
    var $userReply = $('<li class="user"><div class="text">'+ $this.html() +'</div></li>');
    container.children('.chat-window').append($userReply);

    // get the next message
    actOnStepAndSelection($this);
    var nextMessageId = $this.attr('data-nextId');
    var nextMessage = findMessageInJsonById(data, nextMessageId);

    // // add next message
    generateMessageHTML(container, data, nextMessage, delay);
  }

  function actOnStepAndSelection($this){
    var stepId = $this.attr('data-stepId');
    var text = $this.html();
    var code = $this.attr('data-code');

    if(stepId === '3'){ // area
      objectSearch = {};
      objectSearch['page'] = 0;
      objectSearch['area'] = text;
      objectSearch['area_code'] = code;
    } else if(stepId === '5'){ // Tipo
      objectSearch['type'] = text;
      objectSearch['type_code'] = code;
    } else if(stepId === '7'){ // Region, provincia, comuna
      objectSearch['DPA'] = text;
      objectSearch['DPA_code'] = code;
    } else if(stepId === '12'){ // provincia
      objectSearch['provincia'] = text;
      objectSearch['provincia_code'] = code;
    } else if(stepId === '15'){ // provincia de option DPA provincial
      objectSearch['provincia'] = text;
      objectSearch['provincia_code'] = code;
    } else if(stepId === '16' || stepId === '17'){ // comunas de llanquihue
      objectSearch['comuna'] = text;
      objectSearch['comuna_code'] = code;
    } else if(stepId === '20' || stepId === '21'){ // comunas de Chiloe
      objectSearch['comuna'] = text;
      objectSearch['comuna_code'] = code;
    } else if(stepId === '23' || stepId === '24'){ // comunas de Osorno
      objectSearch['comuna'] = text;
      objectSearch['comuna_code'] = code;
    } else if(stepId === '26'){ // comunas de Osorno
      objectSearch['comuna'] = text;
      objectSearch['comuna_code'] = code;
    }
  }

  function startChat(container, data, startId, delay) {
    // clear chat window
    container.html("");
    container.append("<ul class='chat-window'></ul>");

    // get the first message
    var message = findMessageInJsonById(data, startId);

    // add message
    generateMessageHTML(container, data, message, delay);
  }

  function findMessageInJsonById(data, id) {
    const messages = data;
    for (let i = 0; messages.length > i; i++) {
      if (messages[i].id == id) {
        return messages[i];
      }
    }
  }

  function addOptions(container, data, delay, m) {

    var $optionsContainer = $('<li class="options"></li>');

    var $optionsList = $('<ul></ul>');

    var optionText = null;

    var optionMessageId = null;

    var optionCode = null;

    for (var i=1;i<=6;i++) {
      optionText = m["option"+i]
      optionMessageId = m["option"+i+"_nextMessageId"]
      optionCode = m["option"+i+"_code"]

      if (optionText !== "" && optionText !== undefined && optionText !== null) {// add option only if text exists
        var $optionElem = $("<li data-stepId="+ m.id +" data-nextId=" + optionMessageId + " data-code="+ optionCode +">" + optionText + "</li>");

        $optionElem.click(function() {
          selectOption($(this), container, data, delay)
        });

        $optionsList.append($optionElem);
      }
    }

    $optionsContainer.append($optionsList);

    return $optionsContainer;
  }

  function toggleLoader(status, container) {
    if(status === "show")
      container.children('.chat-window').append("<li class='typing-indicator'><span></span><span></span><span></span></li>");
    else
      container.find('.typing-indicator').remove();
  }

  function publishNewMessate($template, container, m, messages, delay) {
    toggleLoader("show", container);
    container.parent().scrollTop(container.parent().prop('scrollHeight'));
    // add delay to chat message
    setTimeout(function () {

      toggleLoader("hide", container);

      container.children('.chat-window').append($template);

      // if the message is a question then add options
      if (m.messageType === "Question")
        container.children('.chat-window').append(addOptions(container, messages, delay, m));

      //container.children(".chat-window").scrollTop($(".chat-window").prop('scrollHeight'));
      container.parent().scrollTop(container.parent().prop('scrollHeight'));

      // call recursively if nextMessageId exists
      if (m.nextMessageId !== "") {
        var nextMessage = findMessageInJsonById(messages, m.nextMessageId)
        generateMessageHTML(container, messages, nextMessage, delay)
      }

    }, delay);
  }

  function generateMessageHTML(container, messages, m, delay) {
    // if require server data
    if(m.api !== undefined){
      const url = window['chatbotApi'];
      const area = objectSearch['area_code'] !== undefined ? objectSearch['area_code'] : '';
      const type = objectSearch['type_code'] !== undefined ? objectSearch['type_code'] : '';
      const provincia = objectSearch['provincia_code'] !== undefined ? objectSearch['provincia_code'] : '';
      const comuna = objectSearch['comuna_code'] !== undefined ? objectSearch['comuna_code'] : '';
      let page = objectSearch['page'] !== undefined ? objectSearch['page'] : 0;
      page = page + 1;
      objectSearch['page'] = page;
      $.get(url + "?region=10&area=" + area + "&type=" + type + "&provincia=" + provincia + "&comuna=" + comuna +"&page=" + page)
      .done(function (data) {
        if(data.info !== undefined && data.info !== null && data.info.length > 0){
          var arrayLinks = '';
          data.info.forEach(element => {
            arrayLinks = arrayLinks + '<li class="bot"><div class="text"><a target="_blank" href="resource/' + element.id + '">' + element.name + '</a></div></li>'
          });
          var $template = $(arrayLinks);
        } else {
          var $template = $('<li class="bot"><div class="text">No fueron encontrados resultados para tu búsqueda.</div></li>');
        }
        publishNewMessate($template, container, m, messages, delay);
      })
      .fail(function (data) {
        var $template = $('<li class="bot error"><div class="text">Ocurrió un error al obtener la información.</div></li>');
        publishNewMessate($template, container, m, messages, delay);
      });
    } else {
      // create template if text is not null
      let text = '';
      if(m.text.indexOf('#PROVINCIA#') > 0){
        text = m.text.replace('#PROVINCIA#', objectSearch['provincia']);
      }else if(m.text.indexOf('#COMUNA#') > 0){
        text = m.text.replace('#COMUNA#', objectSearch['comuna']);
      }else{
        text = m.text;
      }

      if(m.text != null) {
        var $template = $('<li class="bot"><div class="text">'+ text +'</div></li>');
      } else {
        var $template = $('');
      }

      //container.children(".chat-window").scrollTop($(".chat-window").prop('scrollHeight'));
      publishNewMessate($template, container, m, messages, delay);
    }

    // end delay

  } // end function

}( jQuery ));
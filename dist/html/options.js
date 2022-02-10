$('#import').on("click", function () {
    $('#selectFiles[type=file]').trigger('click');
});

$('#export').on("click", function () { save_options(false) });

$('#selectFiles[type=file]').change(function(){
    loadFile();
});
function alertaBoxPro(status, icon, text) {
    $('#alertaBoxPro')
        .html('<strong class="alerta'+status+'Pro alertaBoxPro" style="font-size: 12pt; padding: 15px 5px 0; display: block;"><i class="fas fa-'+icon+'"></i> '+text+'</strong>')
        .dialog({
            height: "auto",
            width: "auto",
            modal: true,
            my: "center",
            at: "center",
            of: window,
            close: function() {
              location.reload(true);
            },
        	buttons: [{
                text: "OK",
                click: function() {
                    $(this).dialog('close');
                    location.reload(true);
                }
            }]
        });
}
function loadFile() {
    var files = document.getElementById('selectFiles').files;
    if (files.length <= 0) { return false; }
    
    var fr = new FileReader();
    fr.onload = function(e) { 
        var result = JSON.parse(e.target.result);        
        chrome.storage.sync.set({
            dataValues: JSON.stringify(result)
        }, function() {
            // Update status to let user know options were saved.
            alertaBoxPro('Sucess', 'check-circle', 'Configura\u00e7\u00f5es carregadas com sucesso!');
            //location.reload(true);
        });
    }
    fr.readAsText(files.item(0));
}

function downloadFile() {
    chrome.storage.sync.get({
        dataValues: ''
    }, function(items) {
        var filename = 'config.json';
        var jsonFile = items.dataValues
        var blob = new Blob([jsonFile], { type: 'application/json;charset=utf-8,%EF%BB%BF' });
        if (navigator.msSaveBlob) { // IE 10+
            navigator.msSaveBlob(blob, filename);
        } else {
            var link = document.createElement("a");
            if (link.download !== undefined) { // feature detection
                // Browsers that support HTML5 download attribute
                var url = URL.createObjectURL(blob);
                link.setAttribute("href", url);
                link.setAttribute("download", filename);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        }
        location.reload(true);
    });
}
// Saves options to chrome.storage
function remove_options() {
        chrome.storage.sync.set({
            dataValues: ''
        }, function() {
            // Update status to let user know options were saved.
            alertaBoxPro('Sucess', 'check-circle', 'Configura\u00e7\u00f5es removidas com sucesso!');
            //location.reload(true); 
        });
}
function save_options(reload) {
    
	var dataValues = [];
    var checkInput = 0;
    $('.options-table').each(function(indexT){
		var input = {};
		$(this).find('.input-config-pro').each(function(indexI){
            $(this).removeClass('inputError');
			var value = $(this).val();
			var inputName = $(this).attr('data-name-input');
            if ($(this).prop('required') && value == '' ) { 
                $(this).addClass('inputError'); 
                checkInput++; 
            } else {
                input[inputName] = value;
            }
		});
		if ( checkInput == 0  ) { dataValues.push(input); }
    });
    dataValues.push({configGeral: changeConfigGeral()});
        
    chrome.storage.sync.set({
        dataValues: JSON.stringify(dataValues)
    }, function() {
        // Update status to let user know options were saved.
        if ( reload == true ) { 
            alertaBoxPro('Sucess', 'check-circle', 'Configura\u00e7\u00f5es salvas com sucesso!');
            console.log(dataValues);
            //location.reload(true); 
        } else { 
            downloadFile(); 
        }
    });
}

// Restores input text state using the preferences
// stored in chrome.storage.
function restore_options() {
    chrome.storage.sync.get({
        dataValues: ''
    }, function(items) {

        var dataValues = ( items.dataValues != '' ) ? JSON.parse(items.dataValues) : [];    
            dataValues = jmespath.search(dataValues, "[?baseName]");
        
        for (i = 0; i < dataValues.length; i++) {
            if ( i > 0 ) { addProfile(); } else { actionRemoveProfile(i); }
        }
        $.each(dataValues, function (indexA, value) {
            $('#options-table-'+indexA).each(function(indexB){
                var nProfile = $(this);
                $.each(value, function (i, v) {
                    nProfile.find('.input-config-pro[data-name-input="'+i+'"]').val(v);
                });
            });
        });
        
        var dataValuesConfig = ( items.dataValues != '' ) ? JSON.parse(items.dataValues) : [];
            dataValuesConfig = jmespath.search(dataValuesConfig, "[*].configGeral | [0]");
            $.each(dataValuesConfig, function (indexB, value) {
                if (value.value === false) { 
                    $('#itemConfigGeral_'+value.name).prop('checked', false); 
                    $('#itemConfigGeral_'+value.name).closest('tr').find('.iconPopup').removeClass('azulColor').addClass('cinzaColor');
                } else if (value.value === true) {
                    $('#itemConfigGeral_'+value.name).prop('checked', true); 
                    $('#itemConfigGeral_'+value.name).closest('tr').find('.iconPopup').addClass('azulColor').removeClass('cinzaColor');
                }
            });

            var diasPesquisa = (dataValuesConfig !== null) ? jmespath.search(dataValuesConfig, "[?name=='diaspesquisa'].value | [0]") : false;
            if (diasPesquisa) { 
                $('#itemConfigGeral_diaspesquisa')
                    .val(diasPesquisa)
                    .closest('tr').find('.iconPopup').addClass('azulColor').removeClass('cinzaColor');
                var prevDay = moment().add(-diasPesquisa, 'day').format('YYYY-MM-DD');
            } else {
                var prevDay = moment().add(-7, 'day').format('YYYY-MM-DD');
            }
            if (dataValues.length > 0) {
                $.each(dataValues, function (i, v) {
                    var urlAgenda = (v.URL_GOV.charAt(v.URL_GOV.length - 1) == '/') ? v.URL_GOV+'#?agenda=sync&data='+prevDay : v.URL_GOV+'/#?agenda=sync&data='+prevDay;
                    $('#options-lista').append('<a class="button" href="'+urlAgenda+'" target="_blank" style="display: block;margin: 10px 0;"><i class="fas fa-calendar-check azulColor"></i> Sincronizar agenda de '+v.baseName+'</a>');
                });
            } else {
                $('#options-lista').html('<center>Nenhuma agenda cadastrada ainda... <a class="button" id="newBase" href="#options-database"><i class="fas fa-plus azulColor"></i> Adicione nova Base de Agenda</a></center>');
                $('#newBase').click(function() { 
                    $('#options-tabs a[href="#options-database"]').trigger('click');
                });
            }
            

    });
}
function actionRemoveProfile(idTable) {
    $('#sca-removeProfile-'+idTable).show().click(function() { 
        $('#options-table-'+idTable).effect('highlight').delay(1).effect('highlight');
        if ( $('.removeProfile').length > 1 ) {
            $('#options-table-'+idTable).fadeOut('slow', function() {
                $(this).remove();
            });
        } else {
            $('#options-table-'+idTable).find('.input-config-pro').val('');
            remove_options();
        }
    });
}
function addProfile() {
    var idTable = $('.options-table').length;
    $("#options-table-0").clone().attr('id', 'options-table-'+idTable).appendTo("#options-profile");
    $("#options-table-"+idTable).find('.input-config-pro').val('');
    $("#options-table-"+idTable).find('.option-ref').each(function(index){
        var idElement = $(this).attr('id').replace('-0', '-'+idTable);
        $(this).attr('id', idElement);
    });
    actionRemoveProfile(idTable);
}
function changeConfigGeral() {
    var arrayShowItensMenu = [];
    $('#options-functions').find('input[name="onoffswitch"]').each(function(){
        if ($(this).is(':checked')) {
            var value = true;
            $(this).closest('tr').find('.iconPopup').addClass('azulColor').removeClass('cinzaColor');
        } else {
            var value = false;
            $(this).closest('tr').find('.iconPopup').removeClass('azulColor').addClass('cinzaColor');
        }
        arrayShowItensMenu.push({name: $(this).attr('data-name'), value: value});
    });
    $('#options-functions').find('input[type="text"]').each(function(){
        if ($(this).val() != '') {
            arrayShowItensMenu.push({name: $(this).attr('data-name'), value: $(this).val()});
        }
    });
    $('#options-functions').find('input[type="number"]').each(function(){
        if ($(this).val() != '') {
            arrayShowItensMenu.push({name: $(this).attr('data-name'), value: parseInt($(this).val()) });
        }
    });
    $('#options-functions').find('select').each(function(){
        if ($(this).val() != '') {
            arrayShowItensMenu.push({name: $(this).attr('data-name'), value: $(this).val()});
        }
    });
    return arrayShowItensMenu;
}
function getManifestExtension() {
    if (typeof browser === "undefined") {
        return chrome.runtime.getManifest();
    } else {
        return browser.runtime.getManifest();
    }
}
function setNamePage() {
    var manifest = getManifestExtension();
    var NAMESPACE_SPRO = manifest.short_name;
    var URLPages_SPRO = manifest.homepage_url;
    var title = 'Configura\u00E7\u00F5es Gerais | '+NAMESPACE_SPRO;
    $('head title').text(title);
    $('a.manual').each(function(){
        $(this).attr('href', URLPages_SPRO+$(this).attr('href'));
    });
}
$('#options-functions').find('input[type="text"], input[type="number"]').on("keyup", function () {
    if ($(this).val() != '') {
        $(this).closest('tr').find('.iconPopup').addClass('azulColor').removeClass('cinzaColor');
    } else {
        $(this).closest('tr').find('.iconPopup').removeClass('azulColor').addClass('cinzaColor');
    }
});
$('input[name="onoffswitch"]').on("change", function () {
    changeConfigGeral();
});
$('.save').click(function() { save_options(true) });
$('#new').click(function() { addProfile() });

$(function(){
    restore_options();
    $('#options-tabs').tabs();
    setNamePage();
});
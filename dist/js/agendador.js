var isEditable = $('#edit-bar').length > 0 ? true : false;
var urlAgendaPublica = false;
var urlAgendaIntegrada = false;
var urlServerICal = 'https://seipro.app/ical/';
var initData = false;
var maxData = false;
var diasPesquisa = 7;
var configBaseAgendas = [];
var configAgendaSelected = [];

function initVars() {
    diasPesquisa = getConfigValue('diaspesquisa') ? getConfigValue('diaspesquisa') : diasPesquisa;
    configBaseAgendas = (localStorageRestore('configAgenda') != null) ? localStorageRestore('configAgenda') : '';
    configBaseAgendas = (configBaseAgendas != '') ? configBaseAgendas.filter(function(v){ if (v.baseName) return v }) : [];
    configAgendaSelected = (configBaseAgendas.length == 0) 
        ? false
        : (sessionStorageRestore('configAgendaSelected') != null ) ? jmespath.search(configBaseAgendas, "[?baseName=='"+sessionStorageRestore('configAgendaSelected')+"'] | [0]") : configBaseAgendas[0];
    if (configAgendaSelected) {
        sessionStorageStore('configAgendaSelected', configAgendaSelected.baseName);
        urlAgendaPublica = configAgendaSelected.URL_GOV;
        urlAgendaIntegrada = configAgendaSelected.URL_ICS;
        urlServerICal = configAgendaSelected.URL_SYNC;
        initButtonBar();
    }
}

function getNextBaseAgenda() {
    var objIndexAgenda = (typeof configBaseAgendas === 'undefined' || configBaseAgendas.length == 0) ? -1 : configBaseAgendas.findIndex((obj => obj.baseName == configAgendaSelected.baseName));
    var nextAgenda = (objIndexAgenda !== -1) ? configBaseAgendas[objIndexAgenda+1] : undefined;
    return (typeof nextAgenda !== 'undefined') ? {id: objIndexAgenda+1, data:nextAgenda} : false;
}
function openNextBaseAgenda(id) {
    var nextAgenda = configBaseAgendas[id];
    if (typeof nextAgenda !== 'undefined') {
        sessionStorageStore('configAgendaSelected', nextAgenda.baseName);
        urlAgendaPublica = nextAgenda.URL_GOV;
        urlAgendaIntegrada = nextAgenda.URL_ICS;
        urlServerICal = nextAgenda.URL_SYNC;
        localStorage.removeItem('lastUpdate');

        var prevDay = moment().add(-diasPesquisa, 'day').format('YYYY-MM-DD');
        var url = (nextAgenda.URL_GOV.charAt(nextAgenda.URL_GOV.length - 1) == '/') ? nextAgenda.URL_GOV+'#?agenda=sync&data='+prevDay : nextAgenda.URL_GOV+'/#?agenda=sync&data='+prevDay
        window.location.href = url;
    } else {
        return false;
    }
}
function getParamsUrlPro(url) {
    var params = {};
    if (typeof url !== 'undefined' && url.indexOf('?') !== -1 && url.indexOf('&') !== -1) {
        var vars = url.split('?')[1].split('&');
        for (var i = 0; i < vars.length; i++) {
            var pair = vars[i].split('=');
            params[pair[0]] = decodeURIComponent(pair[1]);
        }
        return params;
    } else { return false; }
}

function localStorageRestore(item) {
    return isJson(localStorage.getItem(item)) ? JSON.parse(localStorage.getItem(item)) : false;
}
function localStorageStore(item, result) {
    localStorage.setItem(item, JSON.stringify(result));
}
function localStorageRemove(item) {
    localStorage.removeItem(item);
}
function sessionStorageRestore(item) {
    return JSON.parse(sessionStorage.getItem(item));
}
function sessionStorageStore(item, result) {
    sessionStorage.setItem(item, JSON.stringify(result));
}
function sessionStorageRemove(item) {
    sessionStorage.removeItem(item);
}

function isJson(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

function getConfigValue(name) {
    var configAgenda = ( typeof localStorage.getItem('configAgenda') !== 'undefined' && localStorage.getItem('configAgenda') != '' ) ? JSON.parse(localStorage.getItem('configAgenda')) : [];
    var dataValuesConfig = jmespath.search(configAgenda, "[*].configGeral | [0]");
        dataValuesConfig = jmespath.search(dataValuesConfig, "[?name=='"+name+"'].value | [0]");
    return (dataValuesConfig !== null) ? dataValuesConfig : false;
}
function verifyConfigValue(name) {
    var configAgenda = ( typeof localStorage.getItem('configAgenda') !== 'undefined' && localStorage.getItem('configAgenda') != '' ) ? JSON.parse(localStorage.getItem('configAgenda')) : [];
    var dataValuesConfig = jmespath.search(configAgenda, "[*].configGeral | [0]");
        dataValuesConfig = jmespath.search(dataValuesConfig, "[?name=='"+name+"'].value | [0]");
    
    if (dataValuesConfig == true ) {
        return true;
    } else {
        return false;
    }
}
function checkConfigValue(name) {
    var configAgenda = ( typeof localStorage.getItem('configAgenda') !== 'undefined' && localStorage.getItem('configAgenda') != '' ) ? JSON.parse(localStorage.getItem('configAgenda')) : [];
    var dataValuesConfig = jmespath.search(configAgenda, "[*].configGeral | [0]");
        dataValuesConfig = jmespath.search(dataValuesConfig, "[?name=='"+name+"'].value | [0]");
    
    if (dataValuesConfig == false ) {
        return false;
    } else {
        return true;
    }
}

function forEachPromise(items, fn) {
    return items.reduce(function (promise, item) {
        return promise.then(function () {
            return fn(item);
        });
    }, Promise.resolve());
}

function initAgenda(dataAgenda) {
    if (isEditable) {
    
        var urlSelf = (window.location.href.indexOf('?') !== -1) ? window.location.href.split('?')[0].replace('#','') : window.location.href; 
        
        if (urlAgendaPublica != urlSelf) {
            window.location.replace(urlAgendaPublica+'#?agenda=sync&data='+dataAgenda);
            observeUrlInitAgenda();
        } else {
            var status = getParamsUrlPro(window.location.href);
            if (status && status.agenda == 'sync') {
                $('#agenda-sync-btn a i').attr('class', 'fas fa-sync fa-spin');
                appendPanelAgenda(false);
                var dateSync = status.data;
                var sync = getDateSync(dateSync).then(dataSync => {
                    console.log('dataSync',dataSync);
                }).catch(function errorHandler(error) {
                    return (error);
                });
            } else {
                window.location.replace(urlAgendaPublica+'#?agenda=sync&data='+dataAgenda);
                observeUrlInitAgenda();
            }
        }
    
    } else {
        console.log('...LOGIN');
        var urlLogin = (urlAgendaPublica.charAt(urlAgendaPublica.length - 1) == '/') ? urlAgendaPublica+'login' : urlAgendaPublica+'/login';
        window.location.replace(urlLogin);
    }
}

function getDateSync(dataCompromisso) {

    return getAgendaIntegrada(urlAgendaIntegrada, dataCompromisso).then(dataAgendaIntegrada => {
            
        return getCompromissosAgenda(urlAgendaPublica, dataCompromisso).then(dataAgendaPublica => {

            var arrayAgendaIntegrada = (typeof dataAgendaIntegrada[dataCompromisso] !== 'undefined' && dataAgendaIntegrada[dataCompromisso].length > 0) 
                ? jmespath.search(dataAgendaIntegrada[dataCompromisso],"[?summary!='F\u00E9rias'] | [?summary!='Private Appointment']")
                : [];

            if (arrayAgendaIntegrada.length > 0) {
                forEachPromise(arrayAgendaIntegrada, function(itemCompromisso){
                    return new Promise((resolve, reject) => {
                                var v = itemCompromisso;
                                var startDate_endDate = moment(v.dateStart, 'YYY-MM-DD HH:mm').format('HH:mm')+'_'+moment(v.dateEnd, 'YYY-MM-DD HH:mm').format('HH:mm');
                                var checkSummary = jmespath.search(dataAgendaPublica, "[?summary=='"+v.summary+"'] | [0]"); 
                                    checkSummary = checkSummary !== null ? checkSummary : false;
                                var checkDate = jmespath.search(dataAgendaPublica, "[?startDate_endDate=='"+startDate_endDate+"'] | [0]"); 
                                    checkDate = checkDate !== null ? checkDate : false;
                                
                                if (checkDate) {
                                    console.log('...ATUALIZAR COMPROMISSO', v, dataAgendaPublica);
                                    var _return = deleteCompromisso(checkDate._deleteLink).then(resultDelete => {
                                                    if (resultDelete) {
                                                        console.log('...CRIAR COMPROMISSO', v);
                                                        var _return = (v.summary.indexOf('Cancelado:') !== -1) 
                                                                    ? false
                                                                    : saveNewCompromisso(v).then(dataSaveCompromisso => {
                                                                        console.log('saveNewCompromisso',dataSaveCompromisso);
                                                                        appendHtmlNewCompromisso(dataSaveCompromisso);
                                                                        return true;
                                                                    }).catch(function errorHandler(error) {
                                                                        return (error);
                                                                    });
                                                    } else {
                                                        var _return = false;
                                                    }
                                                    return _return;
                                                }).catch(function errorHandler(error) {
                                                    return (error);
                                                });
                                } else {
                                    console.log('...CRIAR COMPROMISSO', v);
                                    var _return = (v.summary.indexOf('Cancelado:') !== -1) 
                                                ? false
                                                : saveNewCompromisso(v).then(dataSaveCompromisso => {
                                                    console.log('saveNewCompromisso',dataSaveCompromisso);
                                                    appendHtmlNewCompromisso(dataSaveCompromisso);
                                                    return true;
                                                }).catch(function errorHandler(error) {
                                                    return (error);
                                                });
                                }
                                resolve(_return);
                            });
                }).then(() => {
                    console.log('done');
                    getNextAgenda();
                    return true;
                });

            } else {
                console.log('...NENHUM COMPROMISSO');
                appendHtmlAgendaVazia(dataCompromisso);
                getNextAgenda();
                return false;
            }
            //console.log(dataAgendaIntegrada[dataCompromisso], dataAgendaPublica);
            
        }).catch(function errorHandler(error) {
            if (error.status == 404) {
                var arrayAgendaIntegrada = (typeof dataAgendaIntegrada[dataCompromisso] !== 'undefined' && dataAgendaIntegrada[dataCompromisso].length > 0) 
                    ? jmespath.search(dataAgendaIntegrada[dataCompromisso],"[?summary!='F\u00E9rias'] | [?summary!='Private Appointment']")
                    : [];
                    
                if (arrayAgendaIntegrada.length > 0) {
                    console.log('...CRIAR AGENDA', arrayAgendaIntegrada);

                    return saveNewAgenda(dataCompromisso).then(dataAgendaNew => {
                        if (dataAgendaNew) { 
                            console.log('...AGENDA CRIADA', dataAgendaNew, dataCompromisso); 

                            forEachPromise(arrayAgendaIntegrada, function(itemCompromisso){
                                return new Promise((resolve, reject) => {
                                            var v = itemCompromisso;
                                            console.log('...CRIAR COMPROMISSO', v);
                
                                            var _return = (v.summary.indexOf('Cancelado:') !== -1) 
                                                        ? appendHtmlCanceladoCompromisso(result).then(() => {
                                                            return true;
                                                        })
                                                        : saveNewCompromisso(v).then(dataSaveCompromisso => {
                                                            console.log('saveNewCompromisso',dataSaveCompromisso);
                                                            appendHtmlNewCompromisso(dataSaveCompromisso);
                                                            return true;
                                                        }).catch(function errorHandler(error) {
                                                            return error;
                                                        });
                                            resolve(_return);
                                        });
                            }).then(() => {
                                console.log('done');
                                getNextAgenda();
                                return true;
                            });
                        }
                    }).catch(function errorHandler(error) {
                        console.log(error);
                        return false;
                    });

                } else {
                    console.log('...NENHUM COMPROMISSO');
                    appendHtmlAgendaVazia(dataCompromisso);
                    getNextAgenda();
                    return false;
                }
            }
        });
        
    }).catch(function errorHandler(error) {
        console.log(error);
        reject(undefined); 
    });
}

function appendHtmlAgendaDone() {
    var prevMonth = moment(initData, 'YYYY-MM-DD').add(-1, 'month').format('YYYY-MM-DD');
    var dataNextAgenda = getNextBaseAgenda();
    var html = '<li class="item-compromisso-wrapper" style="background: #e3eff1;">'+
                '   <div class="item-compromisso">'+
                '      <div class="compromisso-horarios">'+
                '        <i class="fas fa-check-circle" style="color: #46ad43;font-size: 1.5em;"></i>'+
                '      </div>'+
                '      <div class="compromisso-dados">'+
                '        <h2 class="compromisso-titulo">Sincroniza\u00E7\u00E3o conclu\u00EDda</h2>'+
                '    </div>'+
                '      <ul class="compromisso-acoes">'+
                '        <li class="compromisso-acao">'+
                '          <a href="#?agenda=sync&data='+prevMonth+'" onclick="initAgendaPrevMonth(\''+prevMonth+'\');" style="cursor: pointer;"><i class="fas fa-chevron-circle-left"></i> M\u00EAs anterior</a>'+
                '        </li>'+
                (dataNextAgenda ?
                '        <li class="compromisso-acao" style="margin-left: 2em;">'+
                (getConfigValue('sincronizartudo') ?
                '          <a href="#" style="cursor: pointer;"><i class="fas fa-sync fa-spin"></i> Abrindo agenda... ('+dataNextAgenda.data.baseName+')</a>'+
                '' : 
                '          <a href="#" onclick="openNextBaseAgenda('+dataNextAgenda.id+');" style="cursor: pointer;"><i class="fas fa-caret-square-right"></i> Pr\u00F3xima agenda ('+dataNextAgenda.data.baseName+')</a>'+
                '')+
                '        </li>'+
                '' : '')+
                '      </ul>'+
                '  </li>';
    $('#agenda-integrada').find('.list-compromissos').append(html);
    $('#agenda-sync-btn a i').attr('class', 'fas fa-calendar-check');
    localStorage.setItem('lastUpdate', moment().format('YYYY-MM-DD'));
    maxData = initData;
    if (getConfigValue('sincronizartudo')) {
        setTimeout(function(){ 
            openNextBaseAgenda(dataNextAgenda.id);
            console.log('...ABRINDO PROXIMA AGENDA');
        }, 2500);
    }
}
function initAgendaPrevMonth(prevMonth) {
    localStorage.setItem('lastUpdate', prevMonth);
    setTimeout(function(){
        observeUrlInitAgenda(true);
    }, 500);
}
function appendHtmlAgendaVazia(data) {
    var dataMes = moment(data, 'YYYY-MM-DD').format('DD/MM/YYYY');
    var html = '<li class="item-compromisso-wrapper">'+
                '   <div class="item-compromisso">'+
                '      <div class="compromisso-horarios">'+
                '        <i class="far fa-calendar"></i>'+
                '        <div class="horario">'+
                '           <time >'+dataMes+'</time>'+
                '        </div>'+
                '      </div>'+
                '      <div class="compromisso-dados">'+
                '        <h2 class="compromisso-titulo">Nenhum compromisso</h2>'+
                '    </div>'+
                '  </li>';
    $('#agenda-integrada').find('.list-compromissos').append(html);
}
function appendHtmlNewCompromisso(result) {
    var html = '<li class="item-compromisso-wrapper">'+
                '   <div class="item-compromisso">'+
                '      <div class="compromisso-horarios">'+
                '        <i class="far fa-calendar"></i>'+
                '        <div class="horario">'+
                '           <time >'+moment(result.data['form.widgets.start_date-calendar'], 'MM/DD/YYYY').format('DD/MM/YYYY')+'</time>'+
                '        </div>'+
                '        <i class="far fa-clock"></i>'+
                '        <div class="horario">'+
                '           <time class="compromisso-inicio">'+result.data['form.widgets.start_date-hour']+'h'+result.data['form.widgets.start_date-minute']+'</time> - '+
                '           <time class="compromisso-fim">'+result.data['form.widgets.end_date-hour']+'h'+result.data['form.widgets.end_date-minute']+'</time>'+
                '        </div>'+
                '      </div>'+
                '      <div class="compromisso-dados">'+
                '        <h2 class="compromisso-titulo toggle">'+result.data['form.widgets.title']+'</h2>'+
                '        <div class="compromisso-collapse">'+
                (result.data['form.widgets.solicitante'] != '' ?
                '          <div class="compromisso-solicitante">'+
                '            <label>Solicitante</label>'+
                '            '+result.data['form.widgets.solicitante']+
                '          </div>'+
                '' : '')+
                (result.data['form.widgets.attendees'] != '' ?
                '          <div class="compromisso-participantes">'+
                '            <label>Participante(s)</label>'+
                '               '+result.data['form.widgets.attendees']+
                '          </div>'+
                '' : '')+
                (result.data['form.widgets.description'] != '' ?
                '          <div class="compromisso-pauta">'+
                '            <label>Pauta</label>'+
                '            '+result.data['form.widgets.description']+
                '          </div>'+
                '        </div>'+
                '' : '')+
                (result.data['form.widgets.location'] != '' ?
                '        <div class="compromisso-footer">'+
                '           <div class="compromisso-local">'+
                '            '+result.data['form.widgets.location']+
                '           </div>'+
                '        </div>'+
                '' : '')+
                '      </div>'+
                '      <ul class="compromisso-acoes">'+
                '        <li class="compromisso-acao">'+
                '          <a class="compromisso editar_compromisso acao" target="_blank" href="'+result.url+'/edit" style="cursor: pointer;">Editar</a>'+
                '        </li>'+
                '        <li class="compromisso-acao">'+
                '          <a class="compromisso remover_compromisso acao" target="_blank" href="'+result.url+'/delete_confirmation" style="cursor: pointer;">Remover</a>'+
                '        </li>'+
                '      </ul>'+
                '    </div>'+
                '  </li>';
    $('#agenda-integrada').find('.list-compromissos').append(html);
}
function appendHtmlCanceladoCompromisso(dataCompromisso) {
    var html = '<li class="item-compromisso-wrapper">'+
                '   <div class="item-compromisso">'+
                '      <div class="compromisso-horarios">'+
                '        <i class="far fa-calendar"></i>'+
                '        <div class="horario">'+
                '           <time >'+moment(dataCompromisso.dateStart, 'YYYY-MM-DD HH:mm:ss').format('DD/MM/YYYY')+'</time>'+
                '        </div>'+
                '        <i class="far fa-clock"></i>'+
                '        <div class="horario">'+
                '           <time class="compromisso-inicio">'+moment(dataCompromisso.dateStart, 'YYYY-MM-DD HH:mm:ss').format('H')+'h'+moment(dataCompromisso.dateStart, 'YYYY-MM-DD HH:mm:ss').format('m')+'</time> - '+
                '           <time class="compromisso-fim">'+moment(dataCompromisso.dateEnd, 'YYYY-MM-DD HH:mm:ss').format('H')+'h'+moment(dataCompromisso.dateEnd, 'YYYY-MM-DD HH:mm:ss').format('m')+'</time>'+
                '        </div>'+
                '      </div>'+
                '      <div class="compromisso-dados">'+
                '        <h2 class="compromisso-titulo toggle"><span style="background: #e99696;color: #fff;border-radius: 0.5em;font-size: 0.7em;padding: 0 0.5em;">REMOVIDO</span> '+dataCompromisso.summary+'</h2>'+
                '    </div>'+
                '  </li>';
    $('#agenda-integrada').find('.list-compromissos').append(html);
    return true;
}

function getDescriptionData(description, target) {
    var arrayLabels = ['solicitante', 'solicitantes', 'pauta', 'participante', 'participantes', '___', 'ingressar n', 'reuni\u00E3o do', 'participar:', 'meet.google.com', 'evento tem uma videochamada'];
    var index = (description.indexOf(':') !== -1) ? description.split(':').findIndex(function(v){ return v.toLowerCase().indexOf(target) !== -1 }) : -1;
    var _return = (index >= 0) ? description.split(':')[index+1].trim() : '';
        _return = _return.replace(/\\n/g,'\n');
        _return = (_return.indexOf('\n') !== -1) ? _return.split('\n').filter(function(v){ return !arrayLabels.includes(v.toLowerCase()) }).join('\n').trim() : _return;
        _return = (_return.indexOf('\n') !== -1) ? _return.split('\n').map(function(v){ if (!arrayLabels.some((t) => v.toLowerCase().indexOf(t.toLowerCase()) > -1)) return v  }).join('\n').trim() : _return;
        _return = _return.replace(/\\;/g,';');
        _return = _return.replace(/\\,/g,',');
        _return = _return.replace(/\u00D8/g,'');

    return isJson(_return) ? JSON.parse(_return) : _return;
}

function saveNewCompromisso(dataCompromisso) {
    
    var dataCompromissoStart = moment(dataCompromisso.dateStart, 'YYYY-MM-DD HH:mm:ss'); 
    var dataCompromissoEnd = moment(dataCompromisso.dateEnd, 'YYYY-MM-DD HH:mm:ss');
    var href = $('.actionMenuContent #compromisso');
        href = href.length ? href.attr('href') : false;

    if (href) {
        return new Promise((resolve, reject) => {
            $.ajax({ url: href }).done(function (html) {
                var $html = $(html);
                var form = $html.find('#form');
                var hrefForm = form.attr('action');
                var param = {};
                    form.find("input, select, textarea, buttom").each(function () {
                        if ( $(this).attr('name')) {
                            param[$(this).attr('name')] = $(this).val(); 
                        }
                    });
                    param['form.widgets.start_date-day'] = dataCompromissoStart.format('D');
                    param['form.widgets.start_date-month'] = dataCompromissoStart.format('M');
                    param['form.widgets.start_date-year'] = dataCompromissoStart.format('YYYY');
                    param['form.widgets.start_date-hour'] = dataCompromissoStart.format('H');
                    param['form.widgets.start_date-minute'] = dataCompromissoStart.format('m');
                    param['form.widgets.start_date-calendar'] = dataCompromissoStart.format('MM/DD/YYYY');
                
                    param['form.widgets.end_date-day'] = dataCompromissoEnd.format('D');
                    param['form.widgets.end_date-month'] = dataCompromissoEnd.format('M');
                    param['form.widgets.end_date-year'] = dataCompromissoEnd.format('YYYY');
                    param['form.widgets.end_date-hour'] = dataCompromissoEnd.format('H');
                    param['form.widgets.end_date-minute'] = dataCompromissoEnd.format('m');
                    param['form.widgets.end_date-calendar'] = dataCompromissoEnd.format('MM/DD/YYYY');

                    param['form.widgets.location'] = dataCompromisso.location.replace(/\n|\r/g, "");
                    param['form.widgets.title'] = dataCompromisso.summary.replace(/\n|\r/g, "");
                    param['form.widgets.solicitante'] = getDescriptionData(dataCompromisso.description, 'solicitante').replace(/\n|\r/g, "");
                    param['form.widgets.attendees'] = getDescriptionData(dataCompromisso.description, 'participante');
                    param['form.widgets.description'] = getDescriptionData(dataCompromisso.description, 'pauta');
                    param['form.widgets.IVersionable.changeNote'] = dataCompromisso.uid;
                    
                    var xhr = new XMLHttpRequest();
                    var resolveSave = new Promise((resolve, reject) => {
                        $.ajax({
                            type: 'POST',
                            data: param,
                            url: hrefForm,
                            contentType: 'application/x-www-form-urlencoded; charset=ISO-8859-1',
                            xhr: function() {
                                return xhr;
                            },
                        }).done(function (htmlSave) {
                            if (xhr.responseURL != hrefForm) {
                                resolve({url: xhr.responseURL, data: param});
                            } else {
                                reject(undefined); 
                            }
                        }).fail(reject);
                    });
                    resolve(resolveSave);

            }).fail(reject);
        });
    } else {
        return false;
    }
}

function saveNewAgenda(dataAgenda) {

    var href = $('.actionMenuContent #agendadiaria');
        href = href.length ? href.attr('href') : false;

    if (href) {
        return new Promise((resolve, reject) => {
            $.ajax({ url: href }).done(function (html) {
                var $html = $(html);
                var form = $html.find('#form');
                var hrefForm = form.attr('action');
                var param = {};
                    form.find("input, select, textarea, buttom").each(function () {
                        if ( $(this).attr('name')) {
                            param[$(this).attr('name')] = $(this).val(); 
                        }
                    });
                    param['form.widgets.date-day'] = moment(dataAgenda, 'YYYY-MM-DD').format('D');
                    param['form.widgets.date-month'] = moment(dataAgenda, 'YYYY-MM-DD').format('M');
                    param['form.widgets.date-year'] = moment(dataAgenda, 'YYYY-MM-DD').format('YYYY');
                    param['form.widgets.date-calendar'] = moment(dataAgenda, 'YYYY-MM-DD').format('MM/DD/YYYY');
                    
                    var xhr = new XMLHttpRequest();
                    var resolvePrivate = new Promise((resolve, reject) => {
                        $.ajax({
                            type: 'POST',
                            data: param,
                            url: hrefForm,
                            contentType: 'application/x-www-form-urlencoded; charset=ISO-8859-1',
                            xhr: function() {
                                return xhr;
                            },
                        }).done(function (htmlPrivate) {
                            if (xhr.responseURL != hrefForm) {
                                var $htmlPrivate = $(htmlPrivate);
                                var isPrivate = $htmlPrivate.find('#contentActionMenus .actionMenuHeader').hasClass('label-state-private');
                                if (isPrivate) {
                                    var resolvePublish = new Promise((resolve, reject) => {
                                        $.ajax({
                                            url: $htmlPrivate.find('#workflow-transition-publish').attr('href') 
                                        }).done(function(htmlPublish){
                                            var $htmlPublish = $(htmlPublish);
                                            var isPublish = $htmlPublish.find('#contentActionMenus .actionMenuHeader').find('.state-published');
                                            if (isPublish.length) {
                                                resolve(true);
                                            } else {
                                                reject(undefined);
                                            }
                                        }).fail(reject);
                                    });
                                    resolve(resolvePublish);
                                }
                            } else {
                                reject(undefined); 
                            }
                        }).fail(reject);
                    });
                    resolve(resolvePrivate);
            }).fail(reject);
        });
    }
}

function deleteCompromisso(href) {
    if (href) {
        return new Promise((resolve, reject) => {
            $.ajax({ url: href }).done(function (html) {
                var $html = $(html);
                var form = $html.find('form');
                var hrefForm = form.attr('action');
                var param = {};
                    form.find("input, select, textarea, buttom").each(function () {
                        if ( $(this).attr('name')) {
                            param[$(this).attr('name')] = $(this).val(); 
                        }
                    });
                    delete param['form.button.Cancel'];
                
                    var xhr = new XMLHttpRequest();
                    var resolveDelete = new Promise((resolve, reject) => {
                        $.ajax({
                            type: 'POST',
                            data: param,
                            url: hrefForm,
                            contentType: 'application/x-www-form-urlencoded; charset=ISO-8859-1',
                            xhr: function() {
                                return xhr;
                            },
                        }).done(function (htmlDelete) {
                            if (xhr.responseURL != hrefForm) {
                                console.log('...COMPROMISSO DELETADO');
                                resolve(true);
                            } else {
                                console.log('...ERRO AO DELETAR COMPROMISSO');
                                reject(undefined); 
                            }
                        }).fail(reject);
                    });
                    resolve(resolveDelete);
            }).fail(reject);
        });
    }
}

function getCompromissosAgenda(urlAgendaPublica, dataCompromisso) {
    function getLabelELem(elem) {
        var _return = elem.map(function(){
                var label = $(this).find('label');
                    label = (label.length) ? label.text().trim() : false;
                var text = (label) ? $(this).text().trim().replace(label, '').trim() : $(this).text().trim();
                    text = (text.indexOf('\n') !== -1) ? text.split('\n').map(function(v){ if (v.trim() != '') { return v.trim() } }).filter(function(v){ return typeof v !== 'undefined' }) : text;
                return text;
            }).get();
        return (_return.length > 1) ? _return : _return[0];
    }

    var url = (urlAgendaPublica.charAt(urlAgendaPublica.length - 1) == '/') ? urlAgendaPublica+dataCompromisso : urlAgendaPublica+'/'+dataCompromisso;

    return new Promise((resolve, reject) => {
        $.ajax({ 
            url: url,
            success: function(html) { 
                var $html = $(html);
                var arrayCompromissos = [];
                if ($html.find('.compromisso-dados').length > 0) {
                        $html.find('.item-compromisso').each(function(i, v){
                            var startDate = $(this).find('.compromisso-inicio').text().replace('h',':');
                            var endDate =  $(this).find('.compromisso-fim').text().replace('h',':');
                            var params = {
                                _startDate: moment(dataCompromisso+' '+startDate, 'YYY-MM-DD HH:mm'),
                                _endDate: moment(dataCompromisso+' '+endDate, 'YYY-MM-DD HH:mm'),
                                startDate: startDate,
                                endDate: endDate,
                                startDate_endDate: startDate+'_'+endDate,
                                summary: $(this).find('.compromisso-titulo').text(),
                                _deleteLink: $(this).find('a.remover_compromisso').attr('href'),
                                solicitante: getLabelELem($(this).find('.compromisso-solicitante')),
                                attendees: getLabelELem($(this).find('.compromisso-participantes')),
                                description: getLabelELem($(this).find('.compromisso-pauta')),
                                location: getLabelELem($(this).find('.compromisso-local')),
                                selectedDate: dataCompromisso
                            }
                            arrayCompromissos.push(params);
                        });
                }
                resolve(arrayCompromissos);
            },
            fail: function(error) {
                reject(error);
            }
        }).fail(reject);
    });
}

function getAgendaIntegrada(urlAgendaIntegrada, dataCompromisso) {
    return new Promise((resolve, reject) => {
        $.ajax({ 
            url: urlServerICal,
            type: 'GET',
            dataType: 'json',
            data: {
                url: urlAgendaIntegrada,
                date: dataCompromisso
            },
            success: function(data) { 
                resolve(data);
            },
            fail: function(error) {
                reject(error);
            }
        }).fail(reject);
    });
}

function getNextAgenda() {
    window.history.replaceState(null, null, urlAgendaPublica);
    var lastDay = localStorage.getItem('lastUpdate');
    if (lastDay !== null) {
        var _nextDay = moment(lastDay, 'YYYY-MM-DD').add(1, 'day');
        var _maxData = (maxData) ? moment(maxData, 'YYYY-MM-DD') : false;
        if ( (!_maxData &&_nextDay <= moment().add(diasPesquisa, 'day')) || (_maxData && _nextDay < _maxData)) {
            var nextDay = _nextDay.format('YYYY-MM-DD');
                initAgenda(nextDay);
                localStorage.setItem('lastUpdate', nextDay);
        } else {
            appendHtmlAgendaDone();
        }
    }
}

function observeUrlInitAgenda(setInit = false) {
    var status = getParamsUrlPro(window.location.href);
    if (status && status.agenda == 'sync' && status.data != '') {
        if (setInit) {
            initData = status.data;
            console.log('initData', initData);
        }
        initAgenda(status.data);
    }
}

function appendPanelAgenda(clean = false) {
    if ($('#agenda-integrada').length == 0) {
        $('#content').find('#content-core').before('<div id="agenda-integrada" style="margin: 2em 0;"><ul class="list-compromissos"></ul></div>');
    } else if (clean) {
        $('#agenda-integrada .list-compromissos').html('');
    }
}
function initAgendaSync(this_) {
    var _this = $(this_);
    var status = getParamsUrlPro(window.location.href);
    if (!status) {
        var lastDay = (localStorage.getItem('lastUpdate') === null) ? moment().format('YYYY-MM-DD') : localStorage.getItem('lastUpdate');
        var prevDay = moment(lastDay, 'YYYY-MM-DD').add(-diasPesquisa, 'day').format('YYYY-MM-DD');
            maxData = false;
            initData = prevDay;
            initAgenda(prevDay);
            localStorage.setItem('lastUpdate', prevDay);
            appendPanelAgenda(true);
            _this.find('i').attr('class', 'fas fa-sync fa-spin');
    }
}
function getLinkSyncAgenda() {
    var lastDay = (localStorage.getItem('lastUpdate') === null) ? moment().format('YYYY-MM-DD') : localStorage.getItem('lastUpdate');
    var prevDay = moment(lastDay, 'YYYY-MM-DD').add(-diasPesquisa, 'day').format('YYYY-MM-DD');
    var url = (isEditable) 
            ? (urlAgendaPublica.charAt(urlAgendaPublica.length - 1) == '/') ? urlAgendaPublica+'#?agenda=sync&data='+prevDay : urlAgendaPublica+'/#?agenda=sync&data='+prevDay
            : (urlAgendaPublica.charAt(urlAgendaPublica.length - 1) == '/') ? urlAgendaPublica+'login' : urlAgendaPublica+'/login';
    return url;
}

function initButtonBar() {
    var urlLinkSyncAgenda = getLinkSyncAgenda();
    var nameSelected = (typeof configAgendaSelected.baseName !== 'undefined') ? ' ('+configAgendaSelected.baseName+')' : '';
    $('#agenda-sync-btn').remove()
    $('.site-header-links .links-rapidos ul').prepend('<li id="agenda-sync-btn"><a href="'+urlLinkSyncAgenda+'" onclick="initAgendaSync(this)"><i style="margin: 0 0.2em; width: auto;" class="fas fa-calendar-check"></i> Sincronizar Agenda'+nameSelected+'</a></li>');
}

function initActions(TimeOut = 1000) {
    if (TimeOut <= 0) { return; }
    if (typeof jmespath !== 'undefined' && typeof moment !== 'undefined') { 
            console.log('OK', typeof jmespath);
            initVars();
            observeUrlInitAgenda(true);
    } else {
        setTimeout(function(){ 
            initActions(TimeOut - 100); 
            console.log('Reload initActions', TimeOut); 
        }, 500);
    }
}

$(document).ready(function () { 
    initActions();
});
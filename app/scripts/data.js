var filterData = function(reg){
  var etapas_validas = ['en-proyecto','en-licitacion','en-ejecucion','finalizada'];
  return etapas_validas.indexOf(reg.etapa_slug) > -1;
};

var getMontoRange = function(n) {
  var cincuentaM = 50000000;
  /*
    0 a 50 millones
    50 millones a 100 millones
    100 millones a 150 millones
    150 millones para adelante
  */
  var range = "monto_mas_50";
  if (_.inRange(n, 0, cincuentaM)) {
    range = "monto_0_50";
  } else if (_.inRange(n, cincuentaM, cincuentaM * 2)) {
    range = "monto_50_100";
  } else if (_.inRange(n, cincuentaM * 2, cincuentaM * 3)) {
    range = "monto_100_150";
  } else {
    //más de 150 millones
    range = "monto_mas_50";
  }
  return range;
};

var cleanData = function(oldReg, index) {
  var reg = {};
  for (var key in oldReg) {
    if (oldReg.hasOwnProperty(key)) {
      reg[key.toLowerCase()] = oldReg[key];
    }
  }

  reg.compromiso = reg.compromiso == "SI" ? true : false;

  //arrays
  //reg.tipo = (reg.tipo)?reg.tipo.split('|'):[];
  var comunas = reg.comuna ? reg.comuna.split("|") : [null];
  reg.comuna = comunas[0];
  reg.comuna = reg.comuna ? parseInt(reg.comuna.trim()) : reg.comuna;
  reg.barrio = reg.barrio ? reg.barrio.split("|") : [];
  reg.licitacion_oferta_empresa = reg.licitacion_oferta_empresa
    ? reg.licitacion_oferta_empresa
    : null;

  reg.mano_obra = reg.mano_obra ? parseInt(reg.mano_obra) : null;

  //numbers
  reg.id = parseInt(reg.id || index);
  reg.licitacion_anio = reg.licitacion_anio
    ? parseInt(reg.licitacion_anio.trim())
    : null;
  reg.monto_contrato = reg.monto_contrato
    ? parseFloat(reg.monto_contrato.trim())
    : null;
  reg.licitacion_presupuesto_oficial = reg.licitacion_presupuesto_oficial
    ? parseFloat(reg.licitacion_presupuesto_oficial.trim())
    : null;
  reg.plazo_meses = reg.plazo_meses
    ? parseInt(reg.plazo_meses.trim())
    : null;
  reg.porcentaje_avance = reg.porcentaje_avance
    ? reg.porcentaje_avance.trim()
    : "";
  reg.porcentaje_avance.trim();
  reg.porcentaje_avance = isNaN(reg.porcentaje_avance)
    ? ""
    : reg.porcentaje_avance;
  reg.porcentaje_avance = reg.porcentaje_avance
    ? parseFloat(reg.porcentaje_avance)
    : null;

  reg.porcentaje_avance =
    reg.etapa === "Finalizada" ? 100 : reg.porcentaje_avance;

  reg.hideDates =
    reg.etapa === "En proyecto" || reg.etapa === "En licitación";

  reg.fotos = [];
  for (var i = 1; i <= 4; i++) {
    var key = "imagen_" + i;
    if (reg[key]) {
      reg.fotos[i - 1] = reg[key];
    }
  }

  //slug
  reg.entorno_slug = reg.entorno ? Slug.slugify(reg.entorno.trim()) : null;

  reg.etapa_slug = reg.etapa ? Slug.slugify(reg.etapa.trim()) : null;

  reg.tipo_slug = reg.tipo ? Slug.slugify(reg.tipo.trim()) : null;

  reg.entorno = (reg.entorno)?reg.entorno:null;

  reg.area_slug = reg.area_responsable
    ? Slug.slugify(reg.area_responsable.trim())
    : null;

  reg.red_slug = reg.red ? Slug.slugify(reg.red.trim()) : null;

  reg.monto_slug = reg.monto_contrato
    ? getMontoRange(reg.monto_contrato)
    : null;

  return reg;
};


function loadData ($sce, $q, $http) {
  if(!window.MDUYT_CONFIG){
    throw 'Archivo de configuración inexistente';
  }

  var url;
  if (window.MDUYT_CONFIG.LOAD_USING === 'GET_REQUEST') {
    url = window.MDUYT_CONFIG.DATA_CSV;
  } else if (window.MDUYT_CONFIG.LOAD_USING === 'JSONP_PROXY') {
    url = window.MDUYT_CONFIG.JSONP_PROXY + '?source_format=csv&source=' + window.MDUYT_CONFIG.DATA_CSV;
  }
  var trustedUrl = $sce.trustAsResourceUrl(url);

  var deferred = $q.defer();
  var data;

  var onSuccess = function (result) {
    if (window.MDUYT_CONFIG.LOAD_USING === 'GET_REQUEST') {
      data = Papa.parse(result.data, { header:true }).data;
    } else {
      data = result.data;
    }
    data = data.map(cleanData);
    if (window.MDUYT_CONFIG.FILTRAR_ETAPAS) {
      data = data.filter(filterData);
    }
    deferred.resolve(data);
  };

  var onError = function(error) {
    data = error;
    deferred.reject(error);
  };

  if (window.MDUYT_CONFIG.LOAD_USING === 'GET_REQUEST') {
    $http.get(trustedUrl).then(onSuccess, onError);
  } else if (window.MDUYT_CONFIG.LOAD_USING === 'JSONP_PROXY') {
    $http.jsonp(trustedUrl).then(onSuccess, onError);
  }

  return deferred.promise;
}

function loadMapsData () {

}
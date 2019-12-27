     function initSearch()  {
        var fromDate = dijit.byId("fromDate").get('displayedValue');
        var fromDateWithTime = fromDate + " 00:00:00";
        var toDate = dijit.byId("toDate").get('displayedValue');
        var toDateWithTime = toDate + " 23:59:59";
        var queryClause = "";
        queryClause += "sample_date >= '"+fromDateWithTime+"' AND sample_date <= '"+toDateWithTime+"'";
        var species_Selected = dijit.byId("sel_species").attr('value');
        var genus_species = species_Selected.split(" ");
        var genusName = genus_species[0];
        var speciesName = genus_species[1];
        if (speciesName == "spp.") {
          queryClause += " AND (genus = '"+genusName+"')";
        }
        else {
          queryClause += " AND (genus = '"+genusName+"' AND species = '"+speciesName+"')";
        }
        //alert(queryClause);
        var queryTask = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/EnvironmentalMonitoring/HABSOSViewBase/MapServer/0");
        query = new esri.tasks.Query();
        query.returnGeometry = true;
        query.outFields = ["*"];
        query.where = queryClause;
        dojo.byId("results").innerHTML = "<font color='red'><b>Searching ... Please Standby</b></font>";
        queryTask.execute(query,getResultsOnly);
        esri.hide(loading);
        updateSlider(fromDate, toDate);
     }

     function initIdentifies()  {
        // set up as many identify task as needed ... make sure to have declared them in map.htm first
        // this is allowing for identify across multiple map services
        idTask1 = new esri.tasks.IdentifyTask("https://service.ncddc.noaa.gov/arcgis/rest/services/EnvironmentalMonitoring/HABSOSViewBase/MapServer");  // identify cellcount points
        idTask2 = new esri.tasks.IdentifyTask("https://service.ncddc.noaa.gov/arcgis/rest/services/NMSP/FGB/MapServer");  // identify buoy
        idTask3 = new esri.tasks.IdentifyTask("https://service.ncddc.noaa.gov/arcgis/rest/services/InSituStations/InSituStationObservations/MapServer"); // identify currents and river gages
        //idTask4 = new esri.tasks.IdentifyTask("https://service.ln.ncddc.noaa.gov/arcgis/rest/services/EnvironmentalMonitoring/HABSOSViewBase/MapServer"); // identify respiratory irritation forecast .. not ready yet ... BSG
        idParams = new esri.tasks.IdentifyParameters();
        idParams.tolerance = 5;
        idParams.returnGeometry = true;
        idParams.layerOption = esri.tasks.IdentifyParameters.LAYER_OPTION_ALL;
        dojo.connect(map, "onClick", runIdentifies);
     }

     function searchHABSOSDatabase()  {
        // reset sampleDate if it has been used by the timeSlider
        sampleDate = -99;

        // get search parameters
        var fromDate = dijit.byId("fromDate").get('displayedValue');
        var toDate = dijit.byId("toDate").get('displayedValue');

        // get species
        var species_Selected = dijit.byId("sel_species").attr('value');
        var genus_species = species_Selected.split(" ");
        var genusName = genus_species[0];
        var speciesName = genus_species[1];

        // determine if Not Present values should be excluded from search
        var excludeNotPresentReports = dijit.byId('CC_PresentOnly').attr('value');

        // determine if precondition value needs to be applied
        var getCondition = dijit.byId("sel_condition").attr('value');

        var fromDateWithTime = fromDate + " 00:00:00";
        var toDateWithTime = toDate + " 23:59:59";

        // initialize query task
        queryTask = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/EnvironmentalMonitoring/HABSOSViewBase/MapServer/0");

        // initialize query
        query = new esri.tasks.Query();
        query.returnGeometry = true;
        query.outFields = ["*"];

        // set query based on dates
        var queryClause = "";
        queryClause += "sample_date >= '"+fromDateWithTime+"' AND sample_date <= '"+toDateWithTime+"'";

        // add species
        if (speciesName == "spp.") {
          queryClause += " AND (genus = '"+genusName+"')";
        }
        else {
          queryClause += " AND (genus = '"+genusName+"' AND species = '"+speciesName+"')";
        }      

        // add in exclusion if selected
        if (excludeNotPresentReports == "true")  queryClause += " AND NOT category = 'not observed'";
        if (getCondition == "1")  {
          queryClause += " AND (cellcount > 5000)";
        }
        if (getCondition == "2")  {
          queryClause += " AND (cellcount > 50000)";
        }
        if (getCondition == "3")  {
          queryClause += " AND (cellcount > 100000)";
        }
        console.log(queryClause);
        query.where = queryClause;
        dojo.byId("results").innerHTML = "<font color='red'><b>Searching ... Please Standby</b></font>";
        queryTask.execute(query,showResults);
        dojo.byId("timeDate").innerHTML = "";
        updateSlider(fromDate, toDate);
     }

     // this function will only be called by the first initial search
     // NOTE: odd behavior with view format
     //       after initial search, have to go through results without plotting graphics
     //       calls showResults to actually do the plotting 
     function getResultsOnly(featureSet)  {
        var resultFeatures = featureSet.features;
        for (var i=0; i<resultFeatures.length; i++)  {
          var graphic = resultFeatures[i];
          var attributes = graphic.attributes; 
          if (attributes.category == "not observed")  {
            symbol = new esri.symbol.SimpleMarkerSymbol(esri.symbol.SimpleMarkerSymbol.STYLE_X, 6, new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([0,0,0]), 1), new dojo.Color([255,255,255,1]));
          }
          if (attributes.category == "very low")  {
            symbol = new esri.symbol.SimpleMarkerSymbol(esri.symbol.SimpleMarkerSymbol.STYLE_CIRCLE, 6, new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([0,0,0]), 0.75), new dojo.Color([255,255,255,1]));
          }
          if (attributes.category == "low")  {
            symbol = new esri.symbol.SimpleMarkerSymbol(esri.symbol.SimpleMarkerSymbol.STYLE_CIRCLE, 10, new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([0,0,0]), 1), new dojo.Color([255,255,0,1]));
          }
          if (attributes.category == "medium")  {
            symbol = new esri.symbol.SimpleMarkerSymbol(esri.symbol.SimpleMarkerSymbol.STYLE_CIRCLE, 14, new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([0,0,0]), 1), new dojo.Color([255,125,0,1]));
          }
          if (attributes.category == "high")  {
            symbol = new esri.symbol.SimpleMarkerSymbol(esri.symbol.SimpleMarkerSymbol.STYLE_CIRCLE, 18, new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([0,0,0]), 1), new dojo.Color([255,0,0,1]));
          }
        }
        showResults(featureSet);
     }

     function showResults(featureSet)  {
        map.graphics.clear();
        var resultFeatures = featureSet.features;
        for (var i=0; i<resultFeatures.length; i++)  {
          var graphic = resultFeatures[i];
          var attributes = graphic.attributes;
          if (attributes.category == "not observed")  {
            symbol = new esri.symbol.SimpleMarkerSymbol(esri.symbol.SimpleMarkerSymbol.STYLE_X, 6, new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([0,0,0]), 1), new dojo.Color([255,255,255,1]));
          }
          if (attributes.category == "very low")  {
            symbol = new esri.symbol.SimpleMarkerSymbol(esri.symbol.SimpleMarkerSymbol.STYLE_CIRCLE, 6, new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([0,0,0]), 0.75), new dojo.Color([255,255,255,1]));
          }
          if (attributes.category == "low")  {
            symbol = new esri.symbol.SimpleMarkerSymbol(esri.symbol.SimpleMarkerSymbol.STYLE_CIRCLE, 10, new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([0,0,0]), 1), new dojo.Color([255,255,0,1]));
          }
          if (attributes.category == "medium")  {
            symbol = new esri.symbol.SimpleMarkerSymbol(esri.symbol.SimpleMarkerSymbol.STYLE_CIRCLE, 14, new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([0,0,0]), 1), new dojo.Color([255,125,0,1]));
          }
          if (attributes.category == "high")  {
            symbol = new esri.symbol.SimpleMarkerSymbol(esri.symbol.SimpleMarkerSymbol.STYLE_CIRCLE, 18, new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([0,0,0]), 1), new dojo.Color([255,0,0,1]));
          }
          graphic.setSymbol(symbol);
          map.graphics.add(graphic);
        }
        if (resultFeatures.length == 1)  {
          dojo.byId("results").innerHTML = "<table colspan='2'><tr><td align='left'><b>Search Results:</b></td><td align='right'>"+resultFeatures.length+" Report Found</td></tr></table>";
        }
        else  {
          dojo.byId("results").innerHTML = "<table colspan='2'><tr><td align='left'><b>Search Results:</b></td><td align='right'>"+resultFeatures.length+" Reports Found</td></tr></table>";
        }
     }

     function runIdentifies(evt)  {
        dojo.byId("query_msg").innerHTML = "<font color='red'><b>Querying</b></font><br/><img src='images/ajax-loader.gif'>";

        // initialize search parameters
        var fromDate = dijit.byId("fromDate").get('displayedValue');
        var toDate = dijit.byId("toDate").get('displayedValue');
        var fromDateWithTime = fromDate + " 00:00:00";
        var toDateWithTime = toDate + " 23:59:59";

        // for sampling analysis, have to use layerDefinitions in idParams 
        var task1LayerDef = "";
        if (sampleDate == -99)  {
          task1LayerDef += "sample_date >= '"+fromDateWithTime+"' AND sample_date <= '"+toDateWithTime+"'";
        }
        else  {
          var sampleDateFromTime = sampleDate + " 00:00:00";
          var sampleDateToTime = sampleDate + " 23:59:59";
          task1LayerDef += "sample_date >= '"+sampleDateFromTime+"' AND sample_date <= '"+sampleDateToTime+"'";
        }
        // get species
        var species_Selected = dijit.byId("sel_species").attr('value');
        var genus_species = species_Selected.split(" ");
        var genusName = genus_species[0];
        var speciesName = genus_species[1];
        if (speciesName == "spp.") {
          task1LayerDef += " AND (genus = '"+genusName+"')";
        }
        else {
          task1LayerDef += " AND (genus = '"+genusName+"' AND species = '"+speciesName+"')";
        }
        // determine if not observed reports have been excluded
        var excludeNotPresentReports = dijit.byId('CC_PresentOnly').attr('value');
        if (excludeNotPresentReports == "true")  task1LayerDef += " AND NOT category = 'not observed'";
        // determine if precondition has been set        
        var getCondition = dijit.byId('sel_condition').attr('value');
        if (getCondition == "1")  {
          task1LayerDef += " AND (cellcount > 5000)";
        }
        if (getCondition == "2")  {
          task1LayerDef += " AND (cellcount > 50000)";
        }
        if (getCondition == "3")  {
          task1LayerDef += " AND (cellcount > 100000)";
        }        
        console.log("Task1: " + task1LayerDef);
        // need to set up a deferred list so that identify task can work across multiple map services
        var buoys = dijit.byId('buoys').attr('value');
        var windsNDBC = dijit.byId('windsBuoys').attr('value');
        var currentsTABS = dijit.byId('tabsBuoys').attr('value');
        var currentsPORTS = dijit.byId('portsBuoys').attr('value');
        var riverGages = dijit.byId('usgsGages').attr('value');
        var metarStations = dijit.byId('metar').attr('value');
        // respiratory irritation forecasts turned off until retrieval process of data has been established ... BSG
        //var respiratoryIrritationForecasts = dijit.byId('ri_forecast').attr('value');
        var defTask1 = new dojo.Deferred();
        var defTask2 = new dojo.Deferred();
        var defTask3 = new dojo.Deferred();
        //var defTask4 = new dojo.Deferred();
        var defTasks = [];
        defTasks.push(defTask1);
        if (buoys == "true")  {
          defTasks.push(defTask2);
        }
        if ((windsNDBC == "true") || (currentsTABS == "true") || (currentsPORTS == "true") || (riverGages == "true") || (metarStations == "true"))  {
          defTasks.push(defTask3);
        }
        //if (respiratoryIrritationForecasts == "true")  {
        //  defTasks.push(defTask4);
        //}
        var dlTasks = new dojo.DeferredList(defTasks);
        dlTasks.then(showIdentifyResults); //chain showResults onto your DeferredList
        idParams.width = map.width;
        idParams.height = map.height;
        idParams.geometry = evt.mapPoint;
        idParams.mapExtent = map.extent;
        try  {
          idParams.layerIds = [0];
          idParams.layerDefinitions = [];
          idParams.layerDefinitions[0] = task1LayerDef;
          idTask1.execute(idParams, defTask1.callback, defTask1.errback);
        } catch(e)  {
          console.log("Error caught");
          console.log(e);
          defTask1.errback(e);
        }
        if (buoys == "true")  {
          try {
            idParams.layerIds = [2];
            idTask2.execute(idParams, defTask2.callback, defTask2.errback); 
          } catch (e) {
            console.log("Error caught");
            console.log(e);
            defTask2.errback(e); 
          }
        }
        if ((windsNDBC == "true") || (currentsTABS == "true") || (currentsPORTS == "true") || (riverGages == "true") || (metarStations == "true"))  {
          try  {
            var layerList = "";
            if (windsNDBC == "true")  layerList += "0";
            if (currentsTABS == "true")  {
              if (layerList == "")  {
                layerList += "1";
              }
              else  {
                layerList += ",1";
              }
            }
            if (currentsPORTS == "true")  {
              if (layerList == "")  {
                layerList += "2";
              }
              else  {
                layerList += ",2";
              }
            }
            if (riverGages == "true")  {
              if (layerList == "")  {
                layerList += "3";
              }
              else  {
                layerList += ",3";
              }
            }
            if (metarStations == "true")  {
              if (layerList == "")  {
                layerList += "4";
              }
              else  {
                layerList += ",4";
              }
            }
            idParams.layerIds = [layerList];
            idTask3.execute(idParams, defTask3.callback, defTask3.errback);
          } catch (e)  {
            console.log("Error caught");
            console.log(e);
            defTask3.errback(e);
          }
        }
        //if (respiratoryIrritationForecasts == "true")  {
        //  try {
        //    var task4LayerDef = "forecast <> 'unset'";
        //    idParams.layerIds = [8];
        //    idParams.layerDefinitions = [];
        //    idParams.layerDefinitions[7] = task4LayerDef;
        //    idTask4.execute(idParams, defTask4.callback, defTask4.errback);
        //  } catch (e)  {
        //    console.log("Error caught");
        //    console.log(e);
        //    defTask4.errback(e);
        //  }
        //}
     }

     function showIdentifyResults(r) {
        dojo.byId("query_msg").innerHTML = "";
        var results = [];
        r = dojo.filter(r, function (result) {
          return r[0];
        }); //filter out any failed tasks
        for (i=0;i<r.length;i++) {
          results = results.concat(r[i][1]);
        }
        results = dojo.map(results, function(result) {
          var feature = result.feature;
          feature.attributes.layerName = result.layerName;
          var template = new esri.InfoTemplate();
          if (result.layerName == "Cell Counts")  {
            template.setTitle("Cell Counts");
            template.setContent(getCellCountContent);
          }
          if (result.layerName == "Buoys - NDBC")  {
            template.setTitle("Buoys");
            template.setContent(getBuoysContent);
          }
          if (result.layerName == "Winds - Buoys")  {
            template.setTitle("Winds - NDBC Buoys");
            template.setContent(getWindsContent);
          }
          if (result.layerName == "Surface Currents - TABS")  {
            template.setTitle("Surface Currents - TABS");
            template.setContent(getTABSContent);
          }
          if (result.layerName == "Surface Currents - PORTS")  {
            template.setTitle("Surface Currents - PORTS");
            template.setContent(getPORTSContent);
          }
          if (result.layerName == "River Gages")  {
            template.setTitle("River Gages");
            template.setContent(getRiverGagesContent);
          }
          if (result.layerName == "METAR Stations")  {
            template.setTitle("METAR Stations");
            template.setContent(getMETARContent);
          }
          //if (result.layerName == "Respiratory Irritation Forecast")  {
          //  template.setTitle("Respiratory Irritation Forecast");
          //  template.setContent(getRespiratoryIrritationContent);
          //}
          feature.setInfoTemplate(template);
          return feature;
        });
        if(results.length === 0) {
          map.infoWindow.clearFeatures();
        } 
        else {
          map.infoWindow.resize(300,200);
          map.infoWindow.setFeatures(results);
          map.infoWindow.show(idParams.geometry);
        }
        return results;
     }

     function getCellCountContent(graphic)  {
        var latitude = graphic.attributes.latitude;
        if (latitude < 0)  {
          latitude = latitude * -1.;
          latSign = "S";
        }
        else  {
          latSign = "N";
        }
        var longitude = graphic.attributes.longitude;
        if (longitude < 0)  {
          longitude = longitude * -1;
          lonSign = "W";
        }
        else  {
          lonSign = "E";
        }
        var content = "";
        content += '<table colspan="2" class="smallText">';
        if (graphic.attributes.state_id == "FL") content += '<tr><td align="center" width="70%"><b><u>'+graphic.attributes.description+'</u></b><br/>('+latitude+'&deg; '+latSign+', '+longitude+'&deg; '+lonSign+')</td><td align="right" width="30%"><img src="images/fwclogo.png" height="83" width="75"></td></tr>';
        if (graphic.attributes.state_id == "TX") content += '<tr><td align="center" width="70%"><b><u>'+graphic.attributes.description+'</u></b><br/>('+latitude+'&deg; '+latSign+', '+longitude+'&deg; '+lonSign+')</td><td align="right" width="30%"><img src="images/tpwd-logo-large.png" height="75" width="75"></td></tr>';
        if (graphic.attributes.state_id == "AL") content += '<tr><td align="center" width="70%"><b><u>'+graphic.attributes.description+'</u></b><br/>('+latitude+'&deg; '+latSign+', '+longitude+'&deg; '+lonSign+')</td><td align="right" width="30%"><img src="images/ala-department-of-public-health.jpg" height="113" width="75"></td></tr>';
        if (graphic.attributes.state_id == "MS") content += '<tr><td align="center" width="70%"><b><u>'+graphic.attributes.description+'</u></b><br/>('+latitude+'&deg; '+latSign+', '+longitude+'&deg; '+lonSign+')</td><td align="right" width="30%"><img src="images/dmr_logo_130px.jpg" height="75" width="75"></td></tr>';
        content += '</table>';
        if (graphic.attributes.state_id == "LA") content += '<center><b><u>'+graphic.attributes.description+'</u></b><br/>('+latitude+'&deg; '+latSign+', '+longitude+'&deg; '+lonSign+')</center>';
        content += '<p/>';
        content += '<table colspan="2" class="smallText">';
        content += '<tr><td>Species:</td><td>'+graphic.attributes.genus+' '+graphic.attributes.species+'</td></tr>';
        content += '<tr><td>Date Collected:</td><td>'+graphic.attributes.sample_date+'</td></tr>';
        if (graphic.attributes.category == "not observed")  {
          content += '<tr><td>Category:</td><td>'+graphic.attributes.category+'&nbsp;&nbsp;&nbsp;&nbsp;<img src="images/kb_NotObserved.png" height="10" width="10"></td></tr>';
        }
        if (graphic.attributes.category == "very low")  {
          content += '<tr><td>Category:</td><td>'+graphic.attributes.category+' (1-10,000)&nbsp;&nbsp;&nbsp;&nbsp;<img src="images/kb_VeryLow.png" height="10" width="10"></td></tr>';
        }
        if (graphic.attributes.category == "low")  {
          content += '<tr><td>Category:</td><td>'+graphic.attributes.category+' (10,000-100,000)&nbsp;&nbsp;&nbsp;&nbsp;<img src="images/kb_Low.png" height="10" width="10"></td></tr>';
        }
        if (graphic.attributes.category == "medium")  {
          content += '<tr><td>Category:</td><td>'+graphic.attributes.category+' (100,000-1,000,000)&nbsp;&nbsp;&nbsp;&nbsp;<img src="images/kb_Medium.png" height="10" width="10"></td></tr>';
        }
        if (graphic.attributes.category == "high")  {
          content += '<tr><td>Category:</td><td>'+graphic.attributes.category+' (&gt;1,000,000+)&nbsp;&nbsp;&nbsp;&nbsp;<img src="images/kb_High.png" height="10" width="10"></td></tr>';
        }
        //if (graphic.attributes.cellcount == "Null") {
        //  content += '<tr><td>Cell Count:</td><td>Not Available</td></tr>';
        //}
        //else  {
        //  content += '<tr><td>Cell Count:</td><td>'+graphic.attributes.cellcount+'&nbsp;'+graphic.attributes.cellcount_unit+'</td><tr>';
        //}
        if (graphic.attributes.sample_depth == "Null") {
          content += '<tr><td>Sample Depth:</td><td>Not Available</td></tr>';
        }
        else  {
          content += '<tr><td>Sample Depth:</td><td>'+graphic.attributes.sample_depth+' m</td></tr>';
        }
        if (graphic.attributes.water_temp == "Null") {
          content += '<tr><td>Water Temperature:</td><td>Not Available</td></tr>';
        }
        else  {
          content += '<tr><td>Water Temperature:</td><td>'+graphic.attributes.water_temp+'&nbsp;'+graphic.attributes.water_temp_unit+'</td></tr>';
        }
        if (graphic.attributes.salinity == "Null") {
          content += '<tr><td>Salinity:</td><td>Not Available</td></tr>';
        }
        else  {
          content += '<tr><td>Salinity:</td><td>'+graphic.attributes.salinity+'&nbsp;'+graphic.attributes.salinity_unit+'</td></tr>';
        }
        if (graphic.attributes.wind_speed == "Null") {
          content += '<tr><td>Wind Speed:</td><td>Not Available</td></tr>';
        }
        else  {
          content += '<tr><td>Wind Speed:</td><td>'+graphic.attributes.wind_speed+'&nbsp;'+graphic.attributes.wind_speed_unit+'</td></tr>';
        }
        if (graphic.attributes.wind_dir == "Null") {
          content += '<tr><td>Wind Direction:</td><td>Not Available</td></tr>';
        }
        else  {
          content += '<tr><td>Wind Direction:</td><td>'+graphic.attributes.wind_dir+'&nbsp;'+graphic.attributes.wind_dir_unit+'</td></tr>';
        }
        if (graphic.attributes.qa_comment == "Null") {
          content += '<tr><td>Comments:</td><td>Not Available</td></tr>';
        }
        else  {
          content += '<tr><td>Comments:</td><td>'+graphic.attributes.qa_comment+'</td></tr>';
        }
        content += '</table>';
        return content;
     }
 
     function getBuoysContent(graphic)  {
        var latitude = graphic.attributes.lat;
        if (latitude < 0)  {
          latitude = latitude * -1.;
          latSign = "S";
        }
        else  {
          latSign = "N";
        }
        var longitude = graphic.attributes.lon;
        if (longitude < 0)  {
          longitude = longitude * -1;
          lonSign = "W";
        }
        else  {
          lonSign = "E";
        }
        var content = "";
        var station_id = graphic.attributes.station_id;
        var url_tab = "";
        if (station_id == "42047")  url_tab = "http://tabs.gerg.tamu.edu/tglo/ven.php?buoy=V";
        if (station_id == "42046")  url_tab = "http://tabs.gerg.tamu.edu/tglo/ven.php?buoy=N";
        var url = graphic.attributes.url;
        url += '&unit=M';
        content += '<center><b><u>Station ID: '+graphic.attributes.station_id+'</u></b><br/>';
        content += '('+latitude+'&deg; '+latSign+', '+longitude+'&deg; '+lonSign+')</center>';
        content += '<p/>';
        content += '<table colspan="2" class="smallText">';
        content += '<tr><td>Owner:</td><td>'+graphic.attributes.owner+'</td></tr>';
        content += '<tr><td>Type:</td><td>'+graphic.attributes.ttype+'</td></tr>';
        content += '<tr><td>NDBC Page:</td><td><a href="javascript:getBuoyPage(\''+url+'\')"><font color="red"><u>Click to View</u></font></a></td></tr>';
        if (url_tab.length != 0)  {
          content += '<tr><td>TABS Page:</td><td><a href="javascript:getBuoyPage(\''+url_tab+'\')"><font color="red"><u>Click to View</u></font></a></td></tr>';
        }
        content += '</table>';
        return content;
     }

     function getWindsContent(graphic)  {
        var content = "";
        var url = graphic.attributes.hlink;
        content += '<center><b><u>'+graphic.attributes.buoy+'</u></b></center><br/>';
        content += '<p/>';
        content += '<table colspan="2" class="smallText">';
        content += '<tr><td>Date:</td><td>'+graphic.attributes.ddmmmyyyy+'</td></tr>';
        content += '<tr><td>Time:</td><td>'+graphic.attributes.hour+'</td></tr>';
        content += '<tr><td>Wind Speed:</td><td>'+graphic.attributes.wspd+'</td></tr>';
        content += '<tr><td>Wind Direction:</td><td>'+graphic.attributes.wd+'</td></tr>';
        content += '<tr><td>Wave Height:</td><td>'+graphic.attributes.wvht+'</td></tr>';
        content += '<tr><td>Barometric Pressure:</td><td>'+graphic.attributes.baro+'</td</tr>';
        content += '<tr><td>Air Temperature:</td><td>'+graphic.attributes.atmp+'</td></tr>';
        content += '<tr><td>Water Temperature:</td><td>'+graphic.attributes.wtmp+'</td></tr>';
        content += '<tr><td>NDBC Page:</td><td><a href="javascript:getBuoyPage(\''+url+'\')"><font color="red"><u>Click to View</u></font></a></td></tr>';
        content += '</table>';
        return content;        
     }

     function getTABSContent(graphic)  {
        var content = "";
        var url = graphic.attributes.hyperlink;
        content += '<center><b><u>TABS Buoy '+graphic.attributes.buoy+'</u></b></center></br/>';
        content += '<p/>';
        content += '<table colspan="2" class="smallText">';
        content += '<tr><td>Date:</td><td>'+graphic.attributes.mmddyyyy+'</td></tr>';
        content += '<tr><td>Time:</td><td>'+graphic.attributes.time+'</td></tr>';
        content += '<tr><td>Speed:</td><td>'+graphic.attributes.speed+'</td></tr>';
        content += '<tr><td>Direction:</td><td>'+graphic.attributes.direction+'</td></tr>';
        content += '<tr><td>TABS Page:</td><td><a href="javascript:getBuoyPage(\''+url+'\')"><font color="red"><u>Click to View</u></font></a></td></tr>';
        content += '</table>';
        return content;
     }

     function getPORTSContent(graphic)  {
        var latitude = graphic.attributes.latitude;
        if (latitude < 0)  {
          latitude = latitude * -1.;
          latSign = "S";
        }
        else  {
          latSign = "N";
        }
        var longitude = graphic.attributes.longitude;
        if (longitude < 0)  {
          longitude = longitude * -1;
          lonSign = "W";
        }
        else  {
          lonSign = "E";
        }
        var content = "";
        content += '<center><b><u>'+graphic.attributes.buoy+'</u></b></br/>';
        content += '('+latitude+'&deg; '+latSign+', '+longitude+'&deg; '+lonSign+')</center>';
        content += '<p/>';
        content += '<table colspan="2" class="smallText">';
        content += '<tr><td>Date:</td><td>'+graphic.attributes.asofdate+'</td></tr>';
        content += '<tr><td>Time:</td><td>'+graphic.attributes.time_gmt+'</td></tr>';
        content += '<tr><td>Speed:</td><td>'+graphic.attributes.cspd+' cm per sec ('+graphic.attributes.cspd_kts+' kts)</td></tr>';
        content += '<tr><td>Direction:</td><td>'+graphic.attributes.cdir+'</td></tr>';
        content += '</table>';
        return content;
     }

     function getRiverGagesContent(graphic)  {
        var latitude = graphic.attributes.latdd;
        if (latitude < 0)  {
          latitude = latitude * -1.;
          latSign = "S";
        }
        else  {
          latSign = "N";
        }
        var longitude = graphic.attributes.londd;
        if (longitude < 0)  {
          longitude = longitude * -1;
          lonSign = "W";
        }
        else  {
          lonSign = "E";
        }
        var content = "";
        var url = graphic.attributes.url;
        content += '<center><b><u>'+graphic.attributes.staname+'</u></b><br/>';
        content += '('+latitude+'&deg; '+latSign+', '+longitude+'&deg; '+lonSign+')</center>';
        content += '<p/>';
        content += '<table colspan="2" class="smallText">';
        content += '<tr><td>Station ID:</td><td>'+graphic.attributes.staid+'</td></tr>';
        content += '<tr><td>Flow:</td><td>'+graphic.attributes.flow+'</td></tr>';
        content += '<tr><td>Stage:</td><td>'+graphic.attributes.stage+'</td></tr>';
        content += '<tr><td>Time:</td><td>'+graphic.attributes.time+'</td></tr>';
        content += '<tr><td>River Gage Page:</td><td><a href="javascript:getBuoyPage(\''+url+'\')"><font color="red"><u>Click to View</u></font></a></td></tr>';
        content += '</table>';
        return content;
     }

     function getMETARContent(graphic)  {
        var latitude = graphic.attributes.lat;
        if (latitude < 0)  {
          latitude = latitude * -1.;
          latSign = "S";
        }
        else  {
          latSign = "N";
        }
        var longitude = graphic.attributes.lon;
        if (longitude < 0)  {
          longitude = longitude * -1;
          lonSign = "W";
        }
        else  {
          lonSign = "E";
        }
        var content = "";
        var url = graphic.attributes.url;
        content += '<center><b><u>'+graphic.attributes.sta_name+'</u></b><br/>';
        content += '('+latitude+'&deg; '+latSign+', '+longitude+'&deg; '+lonSign+')</center>';
        content += '<p/>';
        content += '<table colspan="2" class="smallText">';
        content += '<tr><td>ICAO:</td><td>'+graphic.attributes.icao+'</td></tr>';
        content += '<tr><td>Elevation:</td><td>'+graphic.attributes.elev+'</td></tr>';
        content += '<tr><td>Type:</td><td>'+graphic.attributes.type+'</td></tr>';
        content += '<tr><td>METAR Station Page:</td><td><a href="javascript:getBuoyPage(\''+url+'\')"><font color="red"><u>Click to View</u></font></a></td></tr>';
        content += '</table>';
        return content;
     }

     function getRespiratoryIrritationContent(graphic)  {
        var today = new Date();
        var mth = today.getMonth() + 1;
        var day = today.getDate();
        var year = today.getFullYear();
        var currentDate = mth + "/" + day + "/" + year;
        var forecastInfoURL = "https://tidesandcurrents.noaa.gov/hab";
        var conditionsURL = "https://tidesandcurrents.noaa.gov/hab/beach_conditions.html";
        var nosURL = "https://tidesandcurrents.noaa.gov/hab/";
        var habsURL = "https://tidesandcurrents.noaa.gov/hab/contributors.html";
        var content = "";
        content += '<table colspan="2" class="smallText">';
        content += '<tr><td align="center" width="70%"><b><u>'+graphic.attributes.name+'</u></b></td><td align="right" width="30%"><img src="images/NOAA_logo.png" height="90" width="90"></td></tr>';
        content += '</table>';
        content += '<p/>';
        content += '<table colspan="2" class="smallText">';
        content += '<tr><td>Forecast Level:</td><td>'+graphic.attributes.forecast+'</td></tr>';
        content += '<tr><td>Date:</td><td>'+graphic.attributes.fdate+'</td></tr>';
        content += '<tr><td>Forecast Info:</td><td><a href="javascript:getHABSPage(\''+forecastInfoURL+'\')"><font color="blue"><u>Click to View</u></font></a></td></tr>';
        content += '<tr><td>Note:</td><td>Irritation varies. Find <a href="javascript:getHABSPage(\''+conditionsURL+'\')"><font color="blue"><u>current conditions.</u></font></a></td></tr>';
        content += '<tr><td>Source:</td><td><a href="javascript:getHABSPage(\''+nosURL+'\')"><font color="blue"><u>NOS CO-OPS</u></font></a> with data from <a href="javascript:getHABSPage(\''+habsURL+'\')"><font color="blue"><u>HAB-OFS contributors</u></font></a></td></tr>';
        content += '</table>';
        return content;
     }


     function switchBasemap(basemap_value)  {
       if (basemap_value == "ocean")  {
         basemap = new esri.layers.ArcGISTiledMapServiceLayer("https://services.arcgisonline.com/ArcGIS/rest/services/Ocean_Basemap/MapServer");
         basemap.id = "Basemap";
       }
       if (basemap_value == "satellite")  {
         basemap = new esri.layers.ArcGISTiledMapServiceLayer("https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer");
         basemap.id = "Basemap";
       }
       if (basemap_value == "natgeo")  {
         basemap = new esri.layers.ArcGISTiledMapServiceLayer("https://services.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer");
         basemap.id = "Basemap";
       }
       if (basemap_value == "topo")  {
         basemap = new esri.layers.ArcGISTiledMapServiceLayer("https://services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer");
         basemap.id = "Basemap";
       }
       baseMapChanged = true;
       UpdateMap();
     }

     function updateSlider(date1,date2)  {
        // if a time slider already exists, delete it
        if (dijit.byId('timeSlider'))  {
          dijit.byId('timeSlider').destroy();
        }
        tsDiv = dojo.create("div", null, dojo.byId('timeSliderDiv'));

        var startTime = new Date(date1);
        var endTime = new Date(date2);
        var ticCount = dojo.date.difference(startTime, endTime);
        ticCount = ticCount + 1;
        // create a time slider from dojo form HorizontalSlider ... not using esri.dijit.TimeSlider because it will only use MODE_SNAPSHOT selections
        timeSlider = new dijit.form.HorizontalSlider({
          id: "timeSlider", 
          value: 0, 
          minimum: 0, 
          maximum: ticCount,
          intermediateChanges: true, 
          discreteValues: ticCount,
          style: "width:75%;", 
          onChange: function(value) {
            sampleTime = dojo.date.add(startTime, "day", value);
            sampleDate = dojo.date.locale.format(sampleTime, {selector: 'date', datePattern: 'yyyy-MM-dd'});
            dojo.byId("timeDate").innerHTML = sampleDate;
            searchSingleDate(sampleDate);
            //matchData2Date(sampleDate);
          }
        }, tsDiv);

        // if labels for time slider exist, delete them
        if (dijit.byId('timeSliderLabels'))  {
          dijit.byId('timeSliderLabels').destroy();
        }
        tsLabelDiv = dojo.create("div", null, dojo.byId('timeSliderLabelsDiv'));
        
        // create labels of beginning and end dates of time slider
        timeSliderLabels = new dijit.form.HorizontalRuleLabels({
          id: "timeSliderLabels",
          container: "bottomDecoration",
          style: "height:10px;font-size:75%;font-weight:bold;color:black;width:75%",
          labels: [date1, date2]
        }, tsLabelDiv);

        timeSlider.startup();
        timeSliderLabels.startup();
     }

     function searchSingleDate(sampleDate)  {

        // reset distance calculations if they are currently being used
        var distanceOnOff = dijit.byId('distanceTool').attr('value');
        if (distanceOnOff == "true")  {
          inputPoints.length = 0;
          totalDistance = 0;
          dojo.byId("distanceDetails").innerHTML = "";
          dojo.style(dojo.byId("distanceDetails"), "display", "none");
        }

        // initialize query task
        queryTask = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/EnvironmentalMonitoring/HABSOSViewBase/MapServer/0");

        // initialize query
        query = new esri.tasks.Query();
        query.returnGeometry = true;
        query.outFields = ["*"];

        var sampleDateFromTime = sampleDate + " 00:00:00";
        var sampleDateToTime = sampleDate + " 23:59:59";

        var queryClause = "";
        queryClause += "sample_date >= '"+sampleDateFromTime+"' AND sample_date <= '"+sampleDateToTime+"'";

        // get species
        var species_Selected = dijit.byId('sel_species').attr('value');
        var genus_species = species_Selected.split(" ");
        var genusName = genus_species[0];
        var speciesName = genus_species[1];
        if (speciesName == "spp.") {
          queryClause += " AND (genus = '"+genusName+"')";
        }
        else {
          queryClause += " AND (genus = '"+genusName+"' AND species = '"+speciesName+"')";
        }
        var excludeNotPresentReports = dijit.byId('CC_PresentOnly').attr('value');
        if (excludeNotPresentReports == "true")  queryClause += " AND NOT category = 'not observed'";
        // determine if precondition has been set
        var getCondition = dijit.byId('sel_condition').attr('value');
        if (getCondition == "1")  {
          queryClause += " AND (cellcount > 5000)";
        }
        if (getCondition == "2")  {
          queryClause += " AND (cellcount > 50000)";
        }
        if (getCondition == "3")  {
          queryClause += " AND (cellcount > 100000)"; 
        }      
        //alert(queryClause);
        query.where = queryClause;

        dojo.byId("results").innerHTML = "<font color='red'><b>Searching ... Please Standby</b></font>";
        queryTask.execute(query,showResults);
     }

     function matchData2Date(matchDate)  {
       //alert(typeof matchDate);
     }

     function showCoordinates(evt) {
        //get mapPoint from event
        //The map is in web mercator - modify the map point to display the results in geographic
        var mp = esri.geometry.webMercatorToGeographic(evt.mapPoint);
        //display mouse coordinates
        dojo.byId("coords").innerHTML = "<b>Longitude: " + mp.x.toFixed(2) + "&nbsp;&nbsp;&nbsp;&nbsp;Latitude: " + mp.y.toFixed(2) + "</b>";
        //dojo.byId("coords").innerHTML = "<b>X: " + evt.mapPoint.x + "&nbsp;&nbsp;&nbsp;Y: " +evt.mapPoint.y + "</b>";
     }

     function UpdateEnd()  {
       updatingMap = false;
       if (usingIE)  {
         dojo.byId("loadingImg").style.display='none';
       }
       else  {
         esri.hide(loading);
       }
     }
 
     function UpdateStart()  {
       updatingMap = true;
       esri.show(loading);
     }

     function UpdateMap()  {
 
       if (updatingMap)  {
         alert("Please wait for previous map to be drawn.\nOnce it is complete, click the Update Map again.");
       }
       else {
         //var respiratoryIrritation = dijit.byId('ri_forecast').attr('value');
         var weatherRadar = dijit.byId('weatherRadar').attr('value');
         var atmp = dijit.byId('atmp').attr('value');
         var atmp_forecast = dijit.byId('atmp_forecast').attr('value');
         var pop12 = dijit.byId('pop12').attr('value');
         var pop12_forecast = dijit.byId('pop12_forecast').attr('value');
         var qpf = dijit.byId('qpf').attr('value');
         var qpf_forecast = dijit.byId('qpf_forecast').attr('value');
         var nam12Winds = dijit.byId('nam12Winds').attr('value');
         var nam12Winds_forecast = dijit.byId('nam12Winds_forecast').attr('value');
         var windsBuoys = dijit.byId('windsBuoys').attr('value');
         var tabsBuoys = dijit.byId('tabsBuoys').attr('value');
         var portsBuoys = dijit.byId('portsBuoys').attr('value');
         var wtmp = dijit.byId('wtmp').attr('value');
         var wtmp_month = parseInt(dijit.byId('wtmp_month').attr('value'));
         var ssc_forecast = dijit.byId('ssc_forecast').attr('value');
         var ssc_timeframe = dijit.byId('ssc_timeframe').attr('value');
         var ssh_forecast = dijit.byId('ssh_forecast').attr('value');
         var ssh_timeframe = dijit.byId('ssh_timeframe').attr('value');
         var sss_forecast = dijit.byId('sss_forecast').attr('value');
         var sss_timeframe = dijit.byId('sss_timeframe').attr('value');
         var sst_forecast = dijit.byId('sst_forecast').attr('value');
         var sst_timeframe = dijit.byId('sst_timeframe').attr('value');
         var chlorophyll_thredds = dijit.byId('chlorophyll_thredds').attr('value');
         var chlorophyll_thredds_timeframe = dijit.byId('chl_thredds_timeframe').attr('value');
         var chlorophyll_anomaly = dijit.byId('chlorophyll_anomaly').attr('value')
         var chlorophyll_anomaly_timeframe = dijit.byId('chl_anomaly_timeframe').attr('value');
         var sst_usf = dijit.byId('sst_usf').attr('value');
         var sst_usf_timeframe = dijit.byId('sst_usf_timeframe').attr('value');
         var ergb_usf = dijit.byId('ergb_usf').attr('value');
         var ergb_usf_timeframe = dijit.byId('ergb_usf_timeframe').attr('value');
         var nflh_usf = dijit.byId('nflh_usf').attr('value');
         var nflh_usf_timeframe = dijit.byId('nflh_usf_timeframe').attr('value');
         var buoys = dijit.byId('buoys').attr('value');
         var metar = dijit.byId('metar').attr('value');
         var usgsGages = dijit.byId('usgsGages').attr('value');
         var bathymetry = dijit.byId('bathymetry').attr('value');
         var estuarine_reserves = dijit.byId('estuarine_reserves').attr('value');
         var marine_sanctuaries = dijit.byId('marine_sanctuaries').attr('value');
         var shellfish_areas = dijit.byId('shellfish_areas').attr('value');
         var graticule = dijit.byId('graticule').attr('value');

         var monthsArray = ["January","February","March","April","May","June","July","August","September","October","November","December"];
         var abbrMonthsArray = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
         var today = new Date();
         var gmtMS = today.getTime() + (today.getTimezoneOffset() * 60000);

         // determine if anything is on the map to begin with ... if so, delete
         var layersOnMap = map.layerIds.length;
         if ((layersOnMap > 1) || (baseMapChanged))  {
           map.removeAllLayers();
           map.addLayer(basemap);
           basemapChanged = false;
         }

         // set some variables
         dojo.byId('layersDetails').innerHTML = "<center><b>Please Standby<br>Accessing Map Services for Data Retrieval</b><p><img src='images/queryServices.gif'></center>";
         var okToMap = true;
         var aDeferreds = [];

         // clear all messages
         //dojo.byId("msgIrritationForecasts").innerHTML = "";
         dojo.byId("msgChlorophyll").innerHTML = "";  
         dojo.byId("msgChlorophyllAnomaly").innerHTML = ""; 
         dojo.byId("msgUSF_ergb").innerHTML = ""; 
         dojo.byId("msgUSF_nflh").innerHTML = ""; 
         dojo.byId("msgUSF_sst").innerHTML = "";       
         dojo.byId("msgWeatherRadar").innerHTML = "";
         dojo.byId("msgMetModels_atmp").innerHTML = "";
         dojo.byId("msgMetModels_pop12").innerHTML = "";
         dojo.byId("msgMetModels_qpf").innerHTML = "";
         dojo.byId("msgOcnModels_ssh").innerHTML = "";
         dojo.byId("msgOcnModels_sss").innerHTML = "";
         dojo.byId("msgOcnModels_sst").innerHTML = "";
         dojo.byId("msgGrid").innerHTML = "";
         dojo.byId("msgBathy").innerHTML = "";
         dojo.byId("msgOcnWTmp").innerHTML = "";
         dojo.byId("msgNERRS").innerHTML = "";
         dojo.byId("msgNMSP").innerHTML = "";
         dojo.byId("msgOysters").innerHTML = "";
         dojo.byId("msgMetModels_nam12winds").innerHTML = "";
         dojo.byId("msgOcnModels_ssc").innerHTML = "";
         dojo.byId("msgBuoys").innerHTML = "";
         dojo.byId("msgMet_NDBCWinds").innerHTML = "";
         dojo.byId("msgOcn_TABS").innerHTML = "";
         dojo.byId("msgOcn_PORTS").innerHTML = "";
         dojo.byId("msgMETAR").innerHTML = "";
         dojo.byId("msgGages").innerHTML = "";;

         // imagery must be displayed first so that polygons, lines, and points can be displayed on top
         // ===========================================================================================

         // chlorophyll - THREDDS
         if (chlorophyll_thredds == "true")  {
           if (chlorophyll_thredds_timeframe != "" )  {
           }
           else  {
             okToMap = false;
             dojo.byId("msgChlorophyll").innerHTML = "<center><font color='red'><b>Need to select date</b></font></center>";
           }
         }
         // chlorophyll anomaly - NOAA CoastWatch
         if (chlorophyll_anomaly == "true")  {
           if (chlorophyll_anomaly_timeframe != "")  {
           }
           else  {
             okToMap = false;
             dojo.byId("msgChlorophyllAnomaly").innerHTML = "<center><font color='red'><b>Need to select date</b></font></center>";
           }
         }
         // ERGB - USF
         if (ergb_usf == "true")  {
           if (ergb_usf_timeframe != "")  {
           }
           else  {
             okToMap = false;
             dojo.byId("msgUSF_ergb").innerHTML = "<center><font color='red'><b>Need to select date</b></font></center>";
           }
         }
         // NFLH - USF
         if (nflh_usf == "true")  {
           if (nflh_usf_timeframe != "")  {
           }
           else  {
             okToMap = false;
             dojo.byId("msgUSF_nflh").innerHTML = "<center><font color='red'><b>Need to select date</b></font></center>";
           }
         }
         // SST - USF
         if (sst_usf == "true")  {
           if (sst_usf_timeframe != "")  {
           }
           else  {
             okToMap = false;
             dojo.byId("msgUSF_sst").innerHTML = "<center><font color='red'><b>Need to select date</b></font></center>";
           }
         }

         // polygons must be displayed next so that lines and points can be displayed on top
         // ================================================================================
         // air temperature from NWS (NDFD)
         if (atmp == "true")  {
           if (atmp_forecast != "")  {
             if (atmp_forecast.indexOf("24 Hr Forecast") != -1)  { forecast = 24; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/NWS_AirTempForecasts/MapServer/1"); }
             if (atmp_forecast.indexOf("48 Hr Forecast") != -1)  { forecast = 48; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/NWS_AirTempForecasts/MapServer/2"); }
             if (atmp_forecast.indexOf("72 Hr Forecast") != -1)  { forecast = 72; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/NWS_AirTempForecasts/MapServer/3"); }
             var time = forecast / 24;
             newDate = new Date(gmtMS + time * 24 * 60 * 60 * 1000);
             mth = newDate.getMonth();
             day = newDate.getDate();
             year = newDate.getFullYear();
             var forecastDate = year + "-" + abbrMonthsArray[mth] + "-" + ((day < 10) ? "0" : "") + day;
             var month = mth + 1;
             var dateParameter = "vdate like '%";
             dateParameter += year + "/" + ((month < 10) ? "0" : "") + month + "/" + ((day < 10) ? "0" : "") + day + "-00Z";
             dateParameter += "%'";
             dojo.byId("msgMetModels_atmp").innerHTML = "<center><img src='images/loading-image.gif'></center>";
             var queryLayer = new esri.tasks.Query();
             queryLayer.where = dateParameter;
             aDeferreds.push(qt.execute(queryLayer));
           }
           else  {
             okToMap = false;
             dojo.byId("msgMetModels_atmp").innerHTML = "<center><font color='red'><b>Need to select forecast date</b></font></center>";
           }            
         }
         // percent precipitation from NWS (NDFD)
         if (pop12 == "true")  {
           if (pop12_forecast != "")  {
             if (pop12_forecast.indexOf("24 Hr Forecast") != -1) { forecast = 24; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/NWS_PercentPrecipitationForecasts/MapServer/1"); }
             if (pop12_forecast.indexOf("48 Hr Forecast") != -1) { forecast = 48; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/NWS_PercentPrecipitationForecasts/MapServer/2"); }
             if (pop12_forecast.indexOf("72 Hr Forecast") != -1) { forecast = 72; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/NWS_PercentPrecipitationForecasts/MapServer/3"); }
             var time = forecast / 24;
             newDate = new Date(gmtMS + time * 24 * 60 * 60 * 1000);
             mth = newDate.getMonth();
             day = newDate.getDate();
             year = newDate.getFullYear();
             var forecastDate = year + "-" + abbrMonthsArray[mth] + "-" + ((day < 10) ? "0" : "") + day;
             var month = mth + 1;
             var dateParameter = "vdate like '%";
             dateParameter += year + "/" + ((month < 10) ? "0" : "") + month + "/" + ((day < 10) ? "0" : "") + day + "-00Z";
             dateParameter += "%'";
             dojo.byId("msgMetModels_pop12").innerHTML = "<center><img src='images/loading-image.gif'></center>";
             var queryLayer = new esri.tasks.Query();
             queryLayer.where = dateParameter;
             aDeferreds.push(qt.execute(queryLayer));
           }
           else  {
             okToMap = false;
             dojo.byId("msgMetModels_pop12").innerHTML = "<center><font color='red'><b>Need to select forecast date</b></font></center>";
           }
         }
         // precipitation amount from NWS (NDFD)
         if (qpf == "true")  {
           if (qpf_forecast != "")  {
             if (qpf_forecast.indexOf("24 Hr Forecast") != -1) { forecast = 24; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/NWS_PrecipitationAmountForecasts/MapServer/1"); }
             if (qpf_forecast.indexOf("48 Hr Forecast") != -1) { forecast = 48; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/NWS_PrecipitationAmountForecasts/MapServer/2"); }
             if (qpf_forecast.indexOf("72 Hr Forecast") != -1) { forecast = 72; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/NWS_PrecipitationAmountForecasts/MapServer/3"); }
             var time = forecast / 24;
             newDate = new Date(gmtMS + time * 24 * 60 * 60 * 1000);
             mth = newDate.getMonth();
             day = newDate.getDate();
             year = newDate.getFullYear();
             var forecastDate = year + "-" + abbrMonthsArray[mth] + "-" + ((day < 10) ? "0" : "") + day;
             var month = mth + 1;
             var dateParameter = "vdate like '%";
             dateParameter += year + "/" + ((month < 10) ? "0" : "") + month + "/" + ((day < 10) ? "0" : "") + day + "-00Z";
             dateParameter += "%'";
             dojo.byId("msgMetModels_qpf").innerHTML = "<center><img src='images/loading-image.gif'></center>";
             var queryLayer = new esri.tasks.Query();
             queryLayer.where = dateParameter;
             aDeferreds.push(qt.execute(queryLayer));
           }
           else  {
             okToMap = false;
             dojo.byId("msgMetModels_qpf").innerHTML = "<center><font color='red'><b>Need to select forecast date</b></font></center>";
           }            
         }
         // sea surface heights (AMSEAS model)
         if (ssh_forecast == "true")  {
           if (ssh_timeframe != "")  {
             if (ssh_timeframe.indexOf("Today") != -1)  { timeframe = 0; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/IASNFS_SeaSurfaceHeightForecasts/MapServer/0"); }
             if (ssh_timeframe.indexOf("24 Hr Forecast") != -1) { timeframe = 1; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/IASNFS_SeaSurfaceHeightForecasts/MapServer/1"); }
             if (ssh_timeframe.indexOf("48 Hr Forecast") != -1) { timeframe = 2; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/IASNFS_SeaSurfaceHeightForecasts/MapServer/2"); }
             if (ssh_timeframe.indexOf("1 Day Ago") != -1) { timeframe = -1; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/AMSEAS_SeaSurfaceHeight_Hindcasts/MapServer/0"); }
             if (ssh_timeframe.indexOf("2 Days Ago") != -1) { timeframe = -2; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/AMSEAS_SeaSurfaceHeight_Hindcasts/MapServer/1"); }
             if (ssh_timeframe.indexOf("3 Days Ago") != -1) { timeframe = -3; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/AMSEAS_SeaSurfaceHeight_Hindcasts/MapServer/2"); }
             if (ssh_timeframe.indexOf("4 Days Ago") != -1) { timeframe = -4;var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/AMSEAS_SeaSurfaceHeight_Hindcasts/MapServer/3"); }
             if (ssh_timeframe.indexOf("5 Days Ago") != -1) { timeframe = -5; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/AMSEAS_SeaSurfaceHeight_Hindcasts/MapServer/4"); }
             if (ssh_timeframe.indexOf("6 Days Ago") != -1) { timeframe = -6; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/AMSEAS_SeaSurfaceHeight_Hindcasts/MapServer/5"); }
             if (ssh_timeframe.indexOf("7 Days Ago") != -1) { timeframe = -7; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/AMSEAS_SeaSurfaceHeight_Hindcasts/MapServer/6"); }
             if (ssh_timeframe.indexOf("8 Days Ago") != -1) { timeframe = -8; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/AMSEAS_SeaSurfaceHeight_Hindcasts/MapServer/7"); }
             if (ssh_timeframe.indexOf("9 Days Ago") != -1) { timeframe = -9; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/AMSEAS_SeaSurfaceHeight_Hindcasts/MapServer/8"); }
             if (ssh_timeframe.indexOf("10 Days Ago") != -1) { timeframe = -10; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/AMSEAS_SeaSurfaceHeight_Hindcasts/MapServer/9"); }
             if (ssh_timeframe.indexOf("11 Days Ago") != -1) { timeframe = -11; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/AMSEAS_SeaSurfaceHeight_Hindcasts/MapServer/10"); }
             if (ssh_timeframe.indexOf("12 Days Ago") != -1) { timeframe = -12; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/AMSEAS_SeaSurfaceHeight_Hindcasts/MapServer/11"); }
             if (ssh_timeframe.indexOf("13 Days Ago") != -1) { timeframe = -13; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/AMSEAS_SeaSurfaceHeight_Hindcasts/MapServer/12"); }
             if (ssh_timeframe.indexOf("14 Days Ago") != -1) { timeframe = -14; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/AMSEAS_SeaSurfaceHeight_Hindcasts/MapServer/13"); }
             if (ssh_timeframe.indexOf("15 Days Ago") != -1) { timeframe = -15; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/AMSEAS_SeaSurfaceHeight_Hindcasts/MapServer/14"); }
             if (ssh_timeframe.indexOf("16 Days Ago") != -1) { timeframe = -16; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/AMSEAS_SeaSurfaceHeight_Hindcasts/MapServer/15"); }
             if (ssh_timeframe.indexOf("17 Days Ago") != -1) { timeframe = -17; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/AMSEAS_SeaSurfaceHeight_Hindcasts/MapServer/16"); }
             if (ssh_timeframe.indexOf("18 Days Ago") != -1) { timeframe = -18; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/AMSEAS_SeaSurfaceHeight_Hindcasts/MapServer/17"); }
             if (ssh_timeframe.indexOf("19 Days Ago") != -1) { timeframe = -19; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/AMSEAS_SeaSurfaceHeight_Hindcasts/MapServer/18"); }
             if (ssh_timeframe.indexOf("20 Days Ago") != -1) { timeframe = -20; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/AMSEAS_SeaSurfaceHeight_Hindcasts/MapServer/19"); }
             if (ssh_timeframe.indexOf("21 Days Ago") != -1) { timeframe = -21; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/AMSEAS_SeaSurfaceHeight_Hindcasts/MapServer/20"); }
             if (ssh_timeframe.indexOf("22 Days Ago") != -1) { timeframe = -22; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/AMSEAS_SeaSurfaceHeight_Hindcasts/MapServer/21"); }
             if (ssh_timeframe.indexOf("23 Days Ago") != -1) { timeframe = -23; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/AMSEAS_SeaSurfaceHeight_Hindcasts/MapServer/22"); }
             if (ssh_timeframe.indexOf("24 Days Ago") != -1) { timeframe = -24; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/AMSEAS_SeaSurfaceHeight_Hindcasts/MapServer/23"); }
             if (ssh_timeframe.indexOf("25 Days Ago") != -1) { timeframe = -25; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/AMSEAS_SeaSurfaceHeight_Hindcasts/MapServer/24"); }
             if (ssh_timeframe.indexOf("26 Days Ago") != -1) { timeframe = -26; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/AMSEAS_SeaSurfaceHeight_Hindcasts/MapServer/25"); }
             if (ssh_timeframe.indexOf("27 Days Ago") != -1) { timeframe = -27; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/AMSEAS_SeaSurfaceHeight_Hindcasts/MapServer/26"); }
             if (ssh_timeframe.indexOf("28 Days Ago") != -1) { timeframe = -28; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/AMSEAS_SeaSurfaceHeight_Hindcasts/MapServer/27"); }
             if (ssh_timeframe.indexOf("29 Days Ago") != -1) { timeframe = -29; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/AMSEAS_SeaSurfaceHeight_Hindcasts/MapServer/28"); }
             newDate = new Date(gmtMS + timeframe * 24 * 60 * 60 * 1000);
             mth = newDate.getMonth();
             day = newDate.getDate();
             year = newDate.getFullYear();
             var forecastDate = year + "-" + abbrMonthsArray[mth] + "-" + ((day < 10) ? "0" : "") + day;
             var imageParameters = new esri.layers.ImageParameters();
             imageParameters.format = "png32";
             if (timeframe >= 0)  {
               mth = today.getMonth();
               day = today.getDate();
               year = today.getFullYear();
               month = mth + 1;
               var dateParameter = "date_='";
               dateParameter += year + "/" + ((month < 10) ? "0" : "") + month + "/" + ((day < 10) ? "0" : "") + day;
               dateParameter += "' AND time='";
               if (timeframe == 0)  dateParameter += "00hr'";
               if (timeframe == 1)  dateParameter += "24hr'";
               if (timeframe == 2)  dateParameter += "48hr'";
             }
             else  {
               timeframe = (timeframe * -1) - 1;
               month = mth + 1;
               var dateParameter = "date_='";
               dateParameter += year + ((month < 10) ? "0" : "") + month + ((day < 10) ? "0" : "") + day;
               dateParameter += "'"; 
             }
             dojo.byId("msgOcnModels_ssh").innerHTML = "<center><img src='images/loading-image.gif'></center>";
             var queryLayer = new esri.tasks.Query();
             queryLayer.where = dateParameter;
             aDeferreds.push(qt.execute(queryLayer));
           }
           else  {
             okToMap = false;
             dojo.byId("msgOcnModels_ssh").innerHTML = "<center><font color='red'><b>Need to select forecast date</b></font></center>";
           }      
         }
         // sea surface salinity (AMSEAS model)
         if (sss_forecast == "true")  {
           if (sss_timeframe != "")  {
             if (sss_timeframe.indexOf("Today") != -1) { timeframe = 0; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/IASNFS_SeaSurfaceSalinityForecasts/MapServer/0"); }
             if (sss_timeframe.indexOf("24 Hr Forecast") != -1) { timeframe = 1; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/IASNFS_SeaSurfaceSalinityForecasts/MapServer/1"); }
             if (sss_timeframe.indexOf("48 Hr Forecast") != -1) { timeframe = 2; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/IASNFS_SeaSurfaceSalinityForecasts/MapServer/2"); }
             if (sss_timeframe.indexOf("1 Day Ago") != -1) { timeframe = -1; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/AMSEAS_SeaSurfaceSalinity_Hindcasts/MapServer/0"); }
             if (sss_timeframe.indexOf("2 Days Ago") != -1) { timeframe = -2; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/AMSEAS_SeaSurfaceSalinity_Hindcasts/MapServer/1"); }
             if (sss_timeframe.indexOf("3 Days Ago") != -1) { timeframe = -3; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/AMSEAS_SeaSurfaceSalinity_Hindcasts/MapServer/2"); }
             if (sss_timeframe.indexOf("4 Days Ago") != -1) { timeframe = -4; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/AMSEAS_SeaSurfaceSalinity_Hindcasts/MapServer/3"); }
             if (sss_timeframe.indexOf("5 Days Ago") != -1) { timeframe = -5; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/AMSEAS_SeaSurfaceSalinity_Hindcasts/MapServer/4"); }
             if (sss_timeframe.indexOf("6 Days Ago") != -1) { timeframe = -6; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/AMSEAS_SeaSurfaceSalinity_Hindcasts/MapServer/5"); }
             if (sss_timeframe.indexOf("7 Days Ago") != -1) { timeframe = -7; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/AMSEAS_SeaSurfaceSalinity_Hindcasts/MapServer/6"); }
             if (sss_timeframe.indexOf("8 Days Ago") != -1) { timeframe = -8; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/AMSEAS_SeaSurfaceSalinity_Hindcasts/MapServer/7"); }
             if (sss_timeframe.indexOf("9 Days Ago") != -1) { timeframe = -9; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/AMSEAS_SeaSurfaceSalinity_Hindcasts/MapServer/8"); }
             if (sss_timeframe.indexOf("10 Days Ago") != -1) { timeframe = -10; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/AMSEAS_SeaSurfaceSalinity_Hindcasts/MapServer/9"); }
             if (sss_timeframe.indexOf("11 Days Ago") != -1) { timeframe = -11; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/AMSEAS_SeaSurfaceSalinity_Hindcasts/MapServer/10"); }
             if (sss_timeframe.indexOf("12 Days Ago") != -1) { timeframe = -12; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/AMSEAS_SeaSurfaceSalinity_Hindcasts/MapServer/11"); }
             if (sss_timeframe.indexOf("13 Days Ago") != -1) { timeframe = -13; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/AMSEAS_SeaSurfaceSalinity_Hindcasts/MapServer/12"); }
             if (sss_timeframe.indexOf("14 Days Ago") != -1) { timeframe = -14; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/AMSEAS_SeaSurfaceSalinity_Hindcasts/MapServer/13"); }
             if (sss_timeframe.indexOf("15 Days Ago") != -1) { timeframe = -15; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/AMSEAS_SeaSurfaceSalinity_Hindcasts/MapServer/14"); }
             if (sss_timeframe.indexOf("16 Days Ago") != -1) { timeframe = -16; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/AMSEAS_SeaSurfaceSalinity_Hindcasts/MapServer/15"); }
             if (sss_timeframe.indexOf("17 Days Ago") != -1) { timeframe = -17; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/AMSEAS_SeaSurfaceSalinity_Hindcasts/MapServer/16"); }
             if (sss_timeframe.indexOf("18 Days Ago") != -1) { timeframe = -18; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/AMSEAS_SeaSurfaceSalinity_Hindcasts/MapServer/17"); }
             if (sss_timeframe.indexOf("19 Days Ago") != -1) { timeframe = -19; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/AMSEAS_SeaSurfaceSalinity_Hindcasts/MapServer/18"); }
             if (sss_timeframe.indexOf("20 Days Ago") != -1) { timeframe = -20; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/AMSEAS_SeaSurfaceSalinity_Hindcasts/MapServer/19"); }
             if (sss_timeframe.indexOf("21 Days Ago") != -1) { timeframe = -21; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/AMSEAS_SeaSurfaceSalinity_Hindcasts/MapServer/20"); }
             if (sss_timeframe.indexOf("22 Days Ago") != -1) { timeframe = -22; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/AMSEAS_SeaSurfaceSalinity_Hindcasts/MapServer/21"); }
             if (sss_timeframe.indexOf("23 Days Ago") != -1) { timeframe = -23; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/AMSEAS_SeaSurfaceSalinity_Hindcasts/MapServer/22"); }
             if (sss_timeframe.indexOf("24 Days Ago") != -1) { timeframe = -24; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/AMSEAS_SeaSurfaceSalinity_Hindcasts/MapServer/23"); }
             if (sss_timeframe.indexOf("25 Days Ago") != -1) { timeframe = -25; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/AMSEAS_SeaSurfaceSalinity_Hindcasts/MapServer/24"); }
             if (sss_timeframe.indexOf("26 Days Ago") != -1) { timeframe = -26; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/AMSEAS_SeaSurfaceSalinity_Hindcasts/MapServer/25"); }
             if (sss_timeframe.indexOf("27 Days Ago") != -1) { timeframe = -27; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/AMSEAS_SeaSurfaceSalinity_Hindcasts/MapServer/26"); }
             if (sss_timeframe.indexOf("28 Days Ago") != -1) { timeframe = -28; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/AMSEAS_SeaSurfaceSalinity_Hindcasts/MapServer/27"); }
             if (sss_timeframe.indexOf("29 Days Ago") != -1) { timeframe = -29; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/AMSEAS_SeaSurfaceSalinity_Hindcasts/MapServer/28"); }
             newDate = new Date(gmtMS + timeframe * 24 * 60 * 60 * 1000);
             mth = newDate.getMonth();
             day = newDate.getDate();
             year = newDate.getFullYear();
             var forecastDate = year + "-" + abbrMonthsArray[mth] + "-" + ((day < 10) ? "0" : "") + day;
             var imageParameters = new esri.layers.ImageParameters();
             imageParameters.format = "png32";
             if (timeframe >= 0)  {
               mth = today.getMonth();
               day = today.getDate();
               year = today.getFullYear();
               month = mth + 1;
               var dateParameter = "date_='";
               dateParameter += year + "/" + ((month < 10) ? "0" : "") + month + "/" + ((day < 10) ? "0" : "") + day;
               dateParameter += "' AND time='";
               if (timeframe == 0)  dateParameter += "00hr'";
               if (timeframe == 1)  dateParameter += "24hr'";
               if (timeframe == 2)  dateParameter += "48hr'";
             }
             else  {
               timeframe = (timeframe * -1) - 1;
               month = mth + 1;
               var dateParameter = "date_='";
               dateParameter += year + ((month < 10) ? "0" : "") + month + ((day < 10) ? "0" : "") + day;
               dateParameter += "'"; 
             }
             dojo.byId("msgOcnModels_sss").innerHTML = "<center><img src='images/loading-image.gif'></center>";
             var queryLayer = new esri.tasks.Query();
             queryLayer.where = dateParameter;
             aDeferreds.push(qt.execute(queryLayer));
           }
           else  {
             okToMap = false;
             dojo.byId("msgOcnModels_sss").innerHTML = "<center><font color='red'><b>Need to select forecast date</b></font></center>";
           }
         }      
         // surface water temperatures (AMSEAS model)
         if (sst_forecast == "true")  {
           if (sst_timeframe != "")  {
             if (sst_timeframe.indexOf("Today") != -1) { timeframe = 0; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/IASNFS_WaterTempForecasts/MapServer/0"); }
             if (sst_timeframe.indexOf("24 Hr Forecast") != -1) { timeframe = 1; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/IASNFS_WaterTempForecasts/MapServer/1"); }
             if (sst_timeframe.indexOf("48 Hr Forecast") != -1) { timeframe = 2; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/IASNFS_WaterTempForecasts/MapServer/2"); }
             if (sst_timeframe.indexOf("1 Day Ago") != -1) { timeframe = -1; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/AMSEAS_WaterTemp_Hindcasts/MapServer/0"); }
             if (sst_timeframe.indexOf("2 Days Ago") != -1) { timeframe = -2; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/AMSEAS_WaterTemp_Hindcasts/MapServer/1"); }
             if (sst_timeframe.indexOf("3 Days Ago") != -1) { timeframe = -3; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/AMSEAS_WaterTemp_Hindcasts/MapServer/2"); }
             if (sst_timeframe.indexOf("4 Days Ago") != -1) { timeframe = -4; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/AMSEAS_WaterTemp_Hindcasts/MapServer/3"); }
             if (sst_timeframe.indexOf("5 Days Ago") != -1) { timeframe = -5; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/AMSEAS_WaterTemp_Hindcasts/MapServer/4"); }
             if (sst_timeframe.indexOf("6 Days Ago") != -1) { timeframe = -6; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/AMSEAS_WaterTemp_Hindcasts/MapServer/5"); }
             if (sst_timeframe.indexOf("7 Days Ago") != -1) { timeframe = -7; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/AMSEAS_WaterTemp_Hindcasts/MapServer/6"); }
             if (sst_timeframe.indexOf("8 Days Ago") != -1) { timeframe = -8; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/AMSEAS_WaterTemp_Hindcasts/MapServer/7"); }
             if (sst_timeframe.indexOf("9 Days Ago") != -1) { timeframe = -9; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/AMSEAS_WaterTemp_Hindcasts/MapServer/8"); }
             if (sst_timeframe.indexOf("10 Days Ago") != -1) { timeframe = -10; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/AMSEAS_WaterTemp_Hindcasts/MapServer/9"); }
             if (sst_timeframe.indexOf("11 Days Ago") != -1) { timeframe = -11; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/AMSEAS_WaterTemp_Hindcasts/MapServer/10"); }
             if (sst_timeframe.indexOf("12 Days Ago") != -1) { timeframe = -12; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/AMSEAS_WaterTemp_Hindcasts/MapServer/11"); }
             if (sst_timeframe.indexOf("13 Days Ago") != -1) { timeframe = -13; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/AMSEAS_WaterTemp_Hindcasts/MapServer/12"); }
             if (sst_timeframe.indexOf("14 Days Ago") != -1) { timeframe = -14; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/AMSEAS_WaterTemp_Hindcasts/MapServer/13"); }
             if (sst_timeframe.indexOf("15 Days Ago") != -1) { timeframe = -15; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/AMSEAS_WaterTemp_Hindcasts/MapServer/14"); }
             if (sst_timeframe.indexOf("16 Days Ago") != -1) { timeframe = -16; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/AMSEAS_WaterTemp_Hindcasts/MapServer/15"); }
             if (sst_timeframe.indexOf("17 Days Ago") != -1) { timeframe = -17; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/AMSEAS_WaterTemp_Hindcasts/MapServer/16"); }
             if (sst_timeframe.indexOf("18 Days Ago") != -1) { timeframe = -18; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/AMSEAS_WaterTemp_Hindcasts/MapServer/17"); }
             if (sst_timeframe.indexOf("19 Days Ago") != -1) { timeframe = -19; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/AMSEAS_WaterTemp_Hindcasts/MapServer/18"); }
             if (sst_timeframe.indexOf("20 Days Ago") != -1) { timeframe = -20; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/AMSEAS_WaterTemp_Hindcasts/MapServer/19"); }
             if (sst_timeframe.indexOf("21 Days Ago") != -1) { timeframe = -21; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/AMSEAS_WaterTemp_Hindcasts/MapServer/20"); }
             if (sst_timeframe.indexOf("22 Days Ago") != -1) { timeframe = -22; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/AMSEAS_WaterTemp_Hindcasts/MapServer/21"); }
             if (sst_timeframe.indexOf("23 Days Ago") != -1) { timeframe = -23; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/AMSEAS_WaterTemp_Hindcasts/MapServer/22"); }
             if (sst_timeframe.indexOf("24 Days Ago") != -1) { timeframe = -24; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/AMSEAS_WaterTemp_Hindcasts/MapServer/23"); }
             if (sst_timeframe.indexOf("25 Days Ago") != -1) { timeframe = -25; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/AMSEAS_WaterTemp_Hindcasts/MapServer/24"); }
             if (sst_timeframe.indexOf("26 Days Ago") != -1) { timeframe = -26; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/AMSEAS_WaterTemp_Hindcasts/MapServer/25"); }
             if (sst_timeframe.indexOf("27 Days Ago") != -1) { timeframe = -27; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/AMSEAS_WaterTemp_Hindcasts/MapServer/26"); }
             if (sst_timeframe.indexOf("28 Days Ago") != -1) { timeframe = -28; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/AMSEAS_WaterTemp_Hindcasts/MapServer/27"); }
             if (sst_timeframe.indexOf("29 Days Ago") != -1) { timeframe = -29; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/AMSEAS_WaterTemp_Hindcasts/MapServer/28"); }
             newDate = new Date(gmtMS + timeframe * 24 * 60 * 60 * 1000);
             mth = newDate.getMonth();
             day = newDate.getDate();
             year = newDate.getFullYear();
             var forecastDate = year + "-" + abbrMonthsArray[mth] + "-" + ((day < 10) ? "0" : "") + day;
             var imageParameters = new esri.layers.ImageParameters();
             imageParameters.format = "png32";
             if (timeframe >= 0)  {
               mth = today.getMonth();
               day = today.getDate();
               year = today.getFullYear();
               month = mth + 1;
               var dateParameter = "date_='";
               dateParameter += year + "/" + ((month < 10) ? "0" : "") + month + "/" + ((day < 10) ? "0" : "") + day;
               dateParameter += "' AND time='";
               if (timeframe == 0)  dateParameter += "00hr'";
               if (timeframe == 1)  dateParameter += "24hr'";
               if (timeframe == 2)  dateParameter += "48hr'";
             }
             else  {
               timeframe = (timeframe * -1) - 1;
               month = mth + 1;
               var dateParameter = "date_='";
               dateParameter += year + ((month < 10) ? "0" : "") + month + ((day < 10) ? "0" : "") + day;
               dateParameter += "'"; 
             }
             dojo.byId("msgOcnModels_sst").innerHTML = "<center><img src='images/loading-image.gif'></center>";
             var queryLayer = new esri.tasks.Query();
             queryLayer.where = dateParameter;
             aDeferreds.push(qt.execute(queryLayer));
           }
           else  {
             okToMap = false;
             dojo.byId("msgOcnModels_sst").innerHTML = "<center><font color='red'><b>Need to select forecast date</b></font></center>";
           }
         }
         // weather radar from NWS  ... removed in 2015 due to change in radar map service .. no longer have any vectors within map service to query against to determine if server running
         //if (weatherRadar == "true")  {
         //  dojo.byId("msgWeatherRadar").innerHTML = "<center><img src='images/loading-image.gif'></center>";
           //var qt = new esri.tasks.QueryTask("http://gis.srh.noaa.gov/ArcGIS/rest/services/Radar_warnings/MapServer/1");
         //  var qt = new esri.tasks.QueryTask("http://gis.srh.noaa.gov/ArcGIS/rest/services/RIDGERadar/MapServer/0");
         //  var queryLayer = new esri.tasks.Query();
         //  queryLayer.where = "1=1";
         //  aDeferreds.push(qt.execute(queryLayer));
         //}
         // respiratory irritation forecasts from HAB-OFs have not yet been established ... BSG
         // assumptions:  this forecast is run on Monday and Thursday and comes out with 3 to 4 forecasts
         //               map service only has one of these forecasts ... the most current ... available for display
         //if (respiratoryIrritation == "true")  {
         //  dojo.byId("msgIrritationForecasts").innerHTML = "<center><img src='images/loading-image.gif'></center>";
         //  var qt = new esri.tasks.QueryTask("https://service.ln.ncddc.noaa.gov/arcgis/rest/services/EnvironmentalMonitoring/HABSOSViewBase/MapServer/4");
         //  mth = today.getMonth();
         //  day = today.getDate();
         //  year = today.getFullYear();
         //  month = mth + 1;
         //  var forecastParameter = "fdate='";
         //  forecastParameter += month + "/" + day + "/" + year;
         //  forecastParameter += "'";
         //  var queryLayer = new esri.tasks.Query();
         //  queryLayer.where = forecastParameter;
         //  aDeferreds.push(qt.execute(queryLayer));
         //}

         // lines must be drawn next so that points can be on top and polygons and images below
         // ===================================================================================
         // graticule from NGDC
         if (graticule == "true")  {
           dojo.byId("msgGrid").innerHTML = "<center><img src='images/loading-image.gif'></center>";
           var qt = new esri.tasks.QueryTask("https://gis.ngdc.noaa.gov/arcgis/rest/services/web_mercator/graticule/MapServer/6");
           var queryLayer = new esri.tasks.Query();
           queryLayer.where = "1=1";
           aDeferreds.push(qt.execute(queryLayer));
         }
         // bathymetry from NGDC
         if (bathymetry == "true")  {
           dojo.byId("msgBathy").innerHTML = "<center><img src='images/loading-image.gif'></center>";
           var qt = new esri.tasks.QueryTask("https://gis.ngdc.noaa.gov/arcgis/rest/services/GulfDataAtlas/NGDC_BathymetricContours_General/MapServer/11");
           var queryLayer = new esri.tasks.Query();
           queryLayer.where = "1=1";
           aDeferreds.push(qt.execute(queryLayer));
         }
         // monthly mean surface water temperature from NODC World Ocean Atlas (2005)
         if (wtmp == "true")  {
           dojo.byId("msgOcnWTmp").innerHTML = "<center><img src='images/loading-image.gif'></center>";
           if (wtmp_month == 0)  var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Climatology/WorldOceanAtlas_WaterTemperature/MapServer/0");
           if (wtmp_month == 1)  var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Climatology/WorldOceanAtlas_WaterTemperature/MapServer/1");
           if (wtmp_month == 2)  var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Climatology/WorldOceanAtlas_WaterTemperature/MapServer/2");
           if (wtmp_month == 3)  var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Climatology/WorldOceanAtlas_WaterTemperature/MapServer/3");
           if (wtmp_month == 4)  var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Climatology/WorldOceanAtlas_WaterTemperature/MapServer/4");
           if (wtmp_month == 5)  var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Climatology/WorldOceanAtlas_WaterTemperature/MapServer/5");
           if (wtmp_month == 6)  var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Climatology/WorldOceanAtlas_WaterTemperature/MapServer/6");
           if (wtmp_month == 7)  var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Climatology/WorldOceanAtlas_WaterTemperature/MapServer/7");
           if (wtmp_month == 8)  var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Climatology/WorldOceanAtlas_WaterTemperature/MapServer/8");
           if (wtmp_month == 9)  var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Climatology/WorldOceanAtlas_WaterTemperature/MapServer/9");
           if (wtmp_month == 10)  var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Climatology/WorldOceanAtlas_WaterTemperature/MapServer/10");
           if (wtmp_month == 11)  var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Climatology/WorldOceanAtlas_WaterTemperature/MapServer/11");
           var queryLayer = new esri.tasks.Query();
           queryLayer.where = "1=1";
           aDeferreds.push(qt.execute(queryLayer));
         }
         // location of NERRs
         if (estuarine_reserves == "true")  {
           dojo.byId("msgNERRS").innerHTML = "<center><img src='images/loading-image.gif'></center>";
           var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/EnvironmentalMonitoring/HABSOSViewBase/MapServer/1");
           var queryLayer = new esri.tasks.Query();
           queryLayer.where = "1=1";
           aDeferreds.push(qt.execute(queryLayer));
         }
         // location of NMSPs
         if (marine_sanctuaries == "true")  {
           dojo.byId("msgNMSP").innerHTML = "<center><img src='images/loading-image.gif'></center>";
           var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/EnvironmentalMonitoring/HABSOSViewBase/MapServer/2");
           var queryLayer = new esri.tasks.Query();
           queryLayer.where = "1=1";
           aDeferreds.push(qt.execute(queryLayer));
         }
         // Shellfish areas
         if (shellfish_areas == "true")  {
           dojo.byId("msgOysters").innerHTML = "<center><img src='images/loading-image.gif'></center>";
           var qt = new esri.tasks.QueryTask("https://gis.ngdc.noaa.gov/arcgis/rest/services/GulfDataAtlas/Oysters_GOM/MapServer/0");
           var queryLayer = new esri.tasks.Query();
           queryLayer.where = "1=1";
           aDeferreds.push(qt.execute(queryLayer));
         }

         // point datasets must be last so that they will be displayed on top of everything else
        // ====================================================================================
         // surface wind forecasts from NAM
         if (nam12Winds == "true")  {
           if (nam12Winds_forecast != "")  {
             if (nam12Winds_forecast.indexOf("00 Hr Forecast") != -1) { forecast = 0; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/NAM12_SurfaceWindForecasts/MapServer/0"); }
             if (nam12Winds_forecast.indexOf("12 Hr Forecast") != -1) { forecast = 12; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/NAM12_SurfaceWindForecasts/MapServer/1"); }
             if (nam12Winds_forecast.indexOf("24 Hr Forecast") != -1) { forecast = 24; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/NAM12_SurfaceWindForecasts/MapServer/2"); }
             if (nam12Winds_forecast.indexOf("36 Hr Forecast") != -1) { forecast = 36; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/NAM12_SurfaceWindForecasts/MapServer/3"); }
             if (nam12Winds_forecast.indexOf("48 Hr Forecast") != -1) { forecast = 48; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/NAM12_SurfaceWindForecasts/MapServer/4"); }
             if (nam12Winds_forecast.indexOf("72 Hr Forecast") != -1) { forecast = 72; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/NAM12_SurfaceWindForecasts/MapServer/5"); }

             var today = new Date();

             if (today.getUTCHours() > 18)  {
               newDate = new Date(gmtMS);
               mth = newDate.getMonth();
               day = newDate.getDate();
               year = newDate.getFullYear();
               var month = mth + 1;
               if (forecast == 0)  {
                 var dateParameter = "vdate like '%";
                 dateParameter += year + ((month < 10) ? "0" : "") + month + ((day < 10) ? "0" : "") + day + " 12 Z + 00 hours";
                 dateParameter += "%'";
               }
               if (forecast == 12)  {
                 var dateParameter = "vdate like '%";
                 dateParameter += year + ((month < 10) ? "0" : "") + month + ((day < 10) ? "0" : "") + day + " 12 Z + 12 hours";
                 dateParameter += "%'";
               }
               if (forecast == 24)  {
                 var dateParameter = "vdate like '%";
                 dateParameter += year + ((month < 10) ? "0" : "") + month + ((day < 10) ? "0" : "") + day + " 12 Z + 24 hours";
                 dateParameter += "%'";
               }
               if (forecast == 36)  {
                 var dateParameter = "vdate like '%";
                 dateParameter += year + ((month < 10) ? "0" : "") + month + ((day < 10) ? "0" : "") + day + " 12 Z + 36 hours";
                 dateParameter += "%'";
               }
               if (forecast == 48)  {
                 var dateParameter = "vdate like '%";
                 dateParameter += year + ((month < 10) ? "0" : "") + month + ((day < 10) ? "0" : "") + day + " 12 Z + 48 hours";
                 dateParameter += "%'";
               }
               if (forecast == 72)  {
                 var dateParameter = "vdate like '%";
                 dateParameter += year + ((month < 10) ? "0" : "") + month + ((day < 10) ? "0" : "") + day + " 12 Z + 72 hours";
                 dateParameter += "%'";
               }
             }
             else  {
               newDate = new Date(gmtMS);
               mth = newDate.getMonth();
               day = newDate.getDate();
               year = newDate.getFullYear();
               var month = mth + 1;
               if (forecast == 0)  {
                 var dateParameter = "vdate like '%";
                 dateParameter += year + ((month < 10) ? "0" : "") + month + ((day < 10) ? "0" : "") + day + " 00 Z + 00 hours";
                 dateParameter += "%'";
               }
               if (forecast == 12)  {
                 var dateParameter = "vdate like '%";
                 dateParameter += year + ((month < 10) ? "0" : "") + month + ((day < 10) ? "0" : "") + day + " 00 Z + 12 hours";
                 dateParameter += "%'";
               }
               if (forecast == 24)  {
                 var dateParameter = "vdate like '%";
                 dateParameter += year + ((month < 10) ? "0" : "") + month + ((day < 10) ? "0" : "") + day + " 00 Z + 24 hours";
                 dateParameter += "%'";
               }
               if (forecast == 36)  {
                 var dateParameter = "vdate like '%";
                 dateParameter += year + ((month < 10) ? "0" : "") + month + ((day < 10) ? "0" : "") + day + " 00 Z + 36 hours";
                 dateParameter += "%'";
               }
               if (forecast == 48)  {
                 var dateParameter = "vdate like '%";
                 dateParameter += year + ((month < 10) ? "0" : "") + month + ((day < 10) ? "0" : "") + day + " 00 Z + 48 hours";
                 dateParameter += "%'";
               }
               if (forecast == 72)  {
                 var dateParameter = "vdate like '%";
                 dateParameter += year + ((month < 10) ? "0" : "") + month + ((day < 10) ? "0" : "") + day + " 00 Z + 72 hours";
                 dateParameter += "%'";
               }
             }
             dojo.byId("msgMetModels_nam12winds").innerHTML = "<center><img src='images/loading-image.gif'></center>";
             var queryLayer = new esri.tasks.Query();
             queryLayer.where = dateParameter;
             aDeferreds.push(qt.execute(queryLayer));
           }
           else  {
             okToMap = false;
             dojo.byId("msgMetModels_nam12winds").innerHTML = "<center><font color='red'><b>Need to select forecast date</b></font></center>";
           }
         }
         // sea surface currents (AMSEAS model)
         if (ssc_forecast == "true")  {
           if (ssc_timeframe != "")  {
             if (ssc_timeframe.indexOf("Today") != -1) { timeframe = 0; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/IASNFS_SurfaceCurrentForecasts/MapServer/0"); }
             if (ssc_timeframe.indexOf("24 Hr Forecast") != -1) { timeframe = 1; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/IASNFS_SurfaceCurrentForecasts/MapServer/1"); }
             if (ssc_timeframe.indexOf("48 Hr Forecast") != -1) { timeframe = 2; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/IASNFS_SurfaceCurrentForecasts/MapServer/2"); }
             if (ssc_timeframe.indexOf("1 Day Ago") != -1) { timeframe = -1; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/AMSEAS_SurfaceCurrent_Hindcasts/MapServer/0"); }
             if (ssc_timeframe.indexOf("2 Days Ago") != -1) { timeframe = -2; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/AMSEAS_SurfaceCurrent_Hindcasts/MapServer/1"); }
             if (ssc_timeframe.indexOf("3 Days Ago") != -1) { timeframe = -3; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/AMSEAS_SurfaceCurrent_Hindcasts/MapServer/2"); }
             if (ssc_timeframe.indexOf("4 Days Ago") != -1) { timeframe = -4; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/AMSEAS_SurfaceCurrent_Hindcasts/MapServer/3"); }
             if (ssc_timeframe.indexOf("5 Days Ago") != -1) { timeframe = -5; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/AMSEAS_SurfaceCurrent_Hindcasts/MapServer/4"); }
             if (ssc_timeframe.indexOf("6 Days Ago") != -1) { timeframe = -6; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/AMSEAS_SurfaceCurrent_Hindcasts/MapServer/5"); }
             if (ssc_timeframe.indexOf("7 Days Ago") != -1) { timeframe = -7; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/AMSEAS_SurfaceCurrent_Hindcasts/MapServer/6"); }
             if (ssc_timeframe.indexOf("8 Days Ago") != -1) { timeframe = -8; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/AMSEAS_SurfaceCurrent_Hindcasts/MapServer/7"); }
             if (ssc_timeframe.indexOf("9 Days Ago") != -1) { timeframe = -9; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/AMSEAS_SurfaceCurrent_Hindcasts/MapServer/8"); }
             if (ssc_timeframe.indexOf("10 Days Ago") != -1) { timeframe = -10; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/AMSEAS_SurfaceCurrent_Hindcasts/MapServer/9"); }
             if (ssc_timeframe.indexOf("11 Days Ago") != -1) { timeframe = -11; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/AMSEAS_SurfaceCurrent_Hindcasts/MapServer/10"); }
             if (ssc_timeframe.indexOf("12 Days Ago") != -1) { timeframe = -12; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/AMSEAS_SurfaceCurrent_Hindcasts/MapServer/11"); }
             if (ssc_timeframe.indexOf("13 Days Ago") != -1) { timeframe = -13; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/AMSEAS_SurfaceCurrent_Hindcasts/MapServer/12"); }
             if (ssc_timeframe.indexOf("14 Days Ago") != -1) { timeframe = -14; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/AMSEAS_SurfaceCurrent_Hindcasts/MapServer/13"); }
             if (ssc_timeframe.indexOf("15 Days Ago") != -1) { timeframe = -15; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/AMSEAS_SurfaceCurrent_Hindcasts/MapServer/14"); }
             if (ssc_timeframe.indexOf("16 Days Ago") != -1) { timeframe = -16; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/AMSEAS_SurfaceCurrent_Hindcasts/MapServer/15"); }
             if (ssc_timeframe.indexOf("17 Days Ago") != -1) { timeframe = -17; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/AMSEAS_SurfaceCurrent_Hindcasts/MapServer/16"); }
             if (ssc_timeframe.indexOf("18 Days Ago") != -1) { timeframe = -18; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/AMSEAS_SurfaceCurrent_Hindcasts/MapServer/17"); }
             if (ssc_timeframe.indexOf("19 Days Ago") != -1) { timeframe = -19; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/AMSEAS_SurfaceCurrent_Hindcasts/MapServer/18"); }
             if (ssc_timeframe.indexOf("20 Days Ago") != -1) { timeframe = -20; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/AMSEAS_SurfaceCurrent_Hindcasts/MapServer/19"); }
             if (ssc_timeframe.indexOf("21 Days Ago") != -1) { timeframe = -21; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/AMSEAS_SurfaceCurrent_Hindcasts/MapServer/20"); }
             if (ssc_timeframe.indexOf("22 Days Ago") != -1) { timeframe = -22; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/AMSEAS_SurfaceCurrent_Hindcasts/MapServer/21"); }
             if (ssc_timeframe.indexOf("23 Days Ago") != -1) { timeframe = -23; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/AMSEAS_SurfaceCurrent_Hindcasts/MapServer/22"); }
             if (ssc_timeframe.indexOf("24 Days Ago") != -1) { timeframe = -24; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/AMSEAS_SurfaceCurrent_Hindcasts/MapServer/23"); }
             if (ssc_timeframe.indexOf("25 Days Ago") != -1) { timeframe = -25; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/AMSEAS_SurfaceCurrent_Hindcasts/MapServer/24"); }
             if (ssc_timeframe.indexOf("26 Days Ago") != -1) { timeframe = -26; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/AMSEAS_SurfaceCurrent_Hindcasts/MapServer/25"); }
             if (ssc_timeframe.indexOf("27 Days Ago") != -1) { timeframe = -27; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/AMSEAS_SurfaceCurrent_Hindcasts/MapServer/26"); }
             if (ssc_timeframe.indexOf("28 Days Ago") != -1) { timeframe = -28; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/AMSEAS_SurfaceCurrent_Hindcasts/MapServer/27"); }
             if (ssc_timeframe.indexOf("29 Days Ago") != -1) { timeframe = -29; var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/AMSEAS_SurfaceCurrent_Hindcasts/MapServer/28"); }
             newDate = new Date(gmtMS + timeframe * 24 * 60 * 60 * 1000);
             mth = newDate.getMonth();
             day = newDate.getDate();
             year = newDate.getFullYear();
             var forecastDate = year + "-" + abbrMonthsArray[mth] + "-" + ((day < 10) ? "0" : "") + day;
             var imageParameters = new esri.layers.ImageParameters();
             imageParameters.format = "png32";
             if (timeframe >= 0)  {
               mth = today.getMonth();
               day = today.getDate();
               year = today.getFullYear();
               month = mth + 1;
               var dateParameter = "date_='";
               dateParameter += year + "/" + ((month < 10) ? "0" : "") + month + "/" + ((day < 10) ? "0" : "") + day;
               dateParameter += "' AND time='";
               if (timeframe == 0)  dateParameter += "00hr'";
               if (timeframe == 1)  dateParameter += "24hr'";
               if (timeframe == 2)  dateParameter += "48hr'";
             }
             else  {
               timeframe = (timeframe * -1) - 1;
               month = mth + 1;
               var dateParameter = "date_='";
               dateParameter += year + ((month < 10) ? "0" : "") + month + ((day < 10) ? "0" : "") + day;
               dateParameter += "'"; 
             }
             dojo.byId("msgOcnModels_ssc").innerHTML = "<center><img src='images/loading-image.gif'></center>";
             var queryLayer = new esri.tasks.Query();
             queryLayer.where = dateParameter;
             aDeferreds.push(qt.execute(queryLayer));
           }
           else  {
             okToMap = false;
             dojo.byId("msgOcnModels_ssc").innerHTML = "<center><font color='red'><b>Need to select forecast date</b></font></center>";
           }     
         }
         // NDBC buoys
         if (buoys == "true")  {
           dojo.byId("msgBuoys").innerHTML = "<center><img src='images/loading-image.gif'></center>";
           var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/NMSP/FGB/MapServer/2");
           var queryLayer = new esri.tasks.Query();
           queryLayer.where = "1=1";
           aDeferreds.push(qt.execute(queryLayer));
         }
         // winds from NDBC buoys
         if (windsBuoys == "true")  {
           dojo.byId("msgMet_NDBCWinds").innerHTML = "<center><img src='images/loading-image.gif'></center>";
           var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/InSituStations/InSituStationObservations/MapServer/0");
           var queryLayer = new esri.tasks.Query();
           queryLayer.where = "1=1";
           aDeferreds.push(qt.execute(queryLayer));
         }
         // surface currents from TABS buoys - current timeframe only
         if (tabsBuoys == "true")  {
           dojo.byId("msgOcn_TABS").innerHTML = "<center><img src='images/loading-image.gif'></center>";
           var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/InSituStations/InSituStationObservations/MapServer/1");
           var queryLayer = new esri.tasks.Query();
           queryLayer.where = "1=1";
           aDeferreds.push(qt.execute(queryLayer));
         }
         // surface currents from PORTS buoys - current timeframe only
         if (portsBuoys == "true")  {
           dojo.byId("msgOcn_PORTS").innerHTML = "<center><img src='images/loading-image.gif'></center>";
           var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/InSituStations/InSituStationObservations/MapServer/2");
           var queryLayer = new esri.tasks.Query();
           queryLayer.where = "1=1";
           aDeferreds.push(qt.execute(queryLayer));
         }
         // METAR stations
         if (metar == "true")  {
           dojo.byId("msgMETAR").innerHTML = "<center><img src='images/loading-image.gif'></center>";
           var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/InSituStations/InSituStationObservations/MapServer/4");
           var queryLayer = new esri.tasks.Query();
           queryLayer.where = "1=1";
           aDeferreds.push(qt.execute(queryLayer));
         }
         // river gages from USGS
         if (usgsGages == "true")  {
           dojo.byId("msgGages").innerHTML = "<center><img src='images/loading-image.gif'></center>";
           var qt = new esri.tasks.QueryTask("https://service.ncddc.noaa.gov/arcgis/rest/services/InSituStations/InSituStationObservations/MapServer/3");
           var queryLayer = new esri.tasks.Query();
           queryLayer.where = "1=1";
           aDeferreds.push(qt.execute(queryLayer));
         }

         // generate deferred list of queries with results being sent to drawMap() function
         if (okToMap)  {
           var deferredList = new dojo.DeferredList(aDeferreds);
           deferredList.then(drawMap);
         }
         else  {
           var content = document.getElementById("msgChlorophyll").textContent;
           if (content.indexOf("select date") != -1)  {
           }
           else  {
             dojo.byId("msgChlorophyll").innerHTML = "";
           }
           var content = document.getElementById("msgChlorophyllAnomaly").textContent;
           if (content.indexOf("select date") != -1)  {
           }
           else  {  
             dojo.byId("msgChlorophyllAnomaly").innerHTML = "";
           }
           var content = document.getElementById("msgUSF_ergb").textContent;
           if (content.indexOf("select date") != -1)  {
           }
           else  { 
             dojo.byId("msgUSF_ergb").innerHTML = ""; 
           }
           var content = document.getElementById("msgUSF_nflh").textContent;
           if (content.indexOf("select date") != -1)  {
           }
           else  {
             dojo.byId("msgUSF_nflh").innerHTML = ""; 
           }
           var content = document.getElementById("msgUSF_sst").textContent;
           if (content.indexOf("select date") != -1)  {
           }
           else  {
             dojo.byId("msgUSF_sst").innerHTML = ""; 
           }
           dojo.byId("msgWeatherRadar").innerHTML = "";
           var content = document.getElementById("msgMetModels_atmp").textContent;
           if (content.indexOf("forecast date") != -1)  {
           }
           else  {
             dojo.byId("msgMetModels_atmp").innerHTML = "";
           }
           var content = document.getElementById("msgMetModels_pop12").textContent;
           if (content.indexOf("forecast date") != -1) {
           }
           else  {
             dojo.byId("msgMetModels_pop12").innerHTML = "";
           }
           var content = document.getElementById("msgMetModels_qpf").textContent;
           if (content.indexOf("forecast date") != -1)  {
           }
           else  {
             dojo.byId("msgMetModels_qpf").innerHTML = "";
           }
           var content = document.getElementById("msgOcnModels_ssh").textContent;
           if (content.indexOf("forecast date") != -1)  {
           }
           else  {
             dojo.byId("msgOcnModels_ssh").innerHTML = "";
           }
           var content = document.getElementById("msgOcnModels_sss").textContent;
           if (content.indexOf("forecast date") != -1)  {
           }
           else {
             dojo.byId("msgOcnModels_sss").innerHTML = "";
           }
           var content = document.getElementById("msgOcnModels_sst").textContent;
           if (content.indexOf("forecast date") != -1)  {
           }
           else  {
             dojo.byId("msgOcnModels_sst").innerHTML = "";
           }
           dojo.byId("msgIrritationForecasts").innerHTML = "";
           dojo.byId("msgGrid").innerHTML = "";
           dojo.byId("msgBathy").innerHTML = "";
           dojo.byId("msgOcnWTmp").innerHTML = "";
           dojo.byId("msgNERRS").innerHTML = "";
           dojo.byId("msgNMSP").innerHTML = "";
           dojo.byId("msgOysters").innerHTML = "";
           var content = document.getElementById("msgMetModels_nam12winds").textContent;
           if (content.indexOf("forecast date") != -1)  {
           }
           else  {
             dojo.byId("msgMetModels_nam12winds").innerHTML = "";
           }
           var content = document.getElementById("msgOcnModels_ssc").textContent;
           if (content.indexOf("forecast date") != -1)  {
           }
           else  {
             dojo.byId("msgOcnModels_ssc").innerHTML = "";
           }
           dojo.byId("msgBuoys").innerHTML = "";
           dojo.byId("msgMet_NDBCWinds").innerHTML = "";
           dojo.byId("msgOcn_TABS").innerHTML = "";
           dojo.byId("msgOcn_PORTS").innerHTML = "";
           dojo.byId("msgMETAR").innerHTML = "";
           dojo.byId("msgGages").innerHTML = "";
           var mapLayerList = "";
           mapLayerList += 'You currently have no additional layers drawn on the map.';
           mapLayerList += '<p/>';
           mapLayerList += 'As you add layers to the map, they will be listed in this panel.';
           mapLayerList += '<p/>';
           mapLayerList += 'You may use this panel to remove any layers added to the map. You can also go back to the "Add Layers" tab to remove layers.';
           dojo.byId("layersDetails").innerHTML = mapLayerList; 
         }
       }
     }

     function drawMap(results)  {

       var queryID = 0;

        //if (!results[queryID][0])  {
        //  alert("Failed");
        //}
        //else  {
        //  featureCount = results[queryID][1].features;
        //  alert(featureCount.length);
        //}

       // this helps determine which layers are to be drawn on the map
       //var respiratoryIrritation = dijit.byId('ri_forecast').attr('value');
       var chlorophyll_thredds = dijit.byId('chlorophyll_thredds').attr('value');
       var chlorophyll_thredds_timeframe = dijit.byId('chl_thredds_timeframe').attr('value');
       var chlorophyll_anomaly = dijit.byId('chlorophyll_anomaly').attr('value')
       var chlorophyll_anomaly_timeframe = dijit.byId('chl_anomaly_timeframe').attr('value');
       var chl_climo_usf = dijit.byId('chl_climo_usf').attr('value');
       var chl_climo_month_usf = dijit.byId('chl_climo_usf_month').attr('value');
       var ergb_usf = dijit.byId('ergb_usf').attr('value');
       var ergb_usf_timeframe = dijit.byId('ergb_usf_timeframe').attr('value');
       var nflh_usf = dijit.byId('nflh_usf').attr('value');
       var nflh_usf_timeframe = dijit.byId('nflh_usf_timeframe').attr('value');
       var sst_usf = dijit.byId('sst_usf').attr('value');
       var sst_usf_timeframe = dijit.byId('sst_usf_timeframe').attr('value');
       var atmp = dijit.byId('atmp').attr('value');
       var atmp_forecast = dijit.byId('atmp_forecast').attr('value');
       var pop12 = dijit.byId('pop12').attr('value');
       var pop12_forecast = dijit.byId('pop12_forecast').attr('value');
       var qpf = dijit.byId('qpf').attr('value');
       var qpf_forecast = dijit.byId('qpf_forecast').attr('value');
       var ssh_forecast = dijit.byId('ssh_forecast').attr('value');
       var ssh_timeframe = dijit.byId('ssh_timeframe').attr('value');
       var sss_forecast = dijit.byId('sss_forecast').attr('value');
       var sss_timeframe = dijit.byId('sss_timeframe').attr('value');
       var sst_forecast = dijit.byId('sst_forecast').attr('value');
       var sst_timeframe = dijit.byId('sst_timeframe').attr('value');
       var weatherRadar = dijit.byId('weatherRadar').attr('value');
       var graticule = dijit.byId('graticule').attr('value');
       var bathymetry = dijit.byId('bathymetry').attr('value');
       var wtmp = dijit.byId('wtmp').attr('value');
       var wtmp_month = parseInt(dijit.byId('wtmp_month').attr('value'));
       var estuarine_reserves = dijit.byId('estuarine_reserves').attr('value');
       var marine_sanctuaries = dijit.byId('marine_sanctuaries').attr('value');
       var shellfish_areas = dijit.byId('shellfish_areas').attr('value');
       var nam12Winds = dijit.byId('nam12Winds').attr('value');
       var nam12Winds_forecast = dijit.byId('nam12Winds_forecast').attr('value');
       var ssc_forecast = dijit.byId('ssc_forecast').attr('value');
       var ssc_timeframe = dijit.byId('ssc_timeframe').attr('value');
       var buoys = dijit.byId('buoys').attr('value');
       var windsBuoys = dijit.byId('windsBuoys').attr('value');
       var tabsBuoys = dijit.byId('tabsBuoys').attr('value');
       var portsBuoys = dijit.byId('portsBuoys').attr('value');
       var metar = dijit.byId('metar').attr('value');
       var usgsGages = dijit.byId('usgsGages').attr('value');

       // generate variables containing date information necessary for calculations
       var monthsArray = ["January","February","March","April","May","June","July","August","September","October","November","December"];
       var abbrMonthsArray = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
       var today = new Date();
       var gmtMS = today.getTime() + (today.getTimezoneOffset() * 60000);

       // chlorophyll - THREDDS
       if (chlorophyll_thredds == "true")  {
         if (chlorophyll_thredds_timeframe.indexOf("1 Day Ago") != -1)  timeframe = -1;
         if (chlorophyll_thredds_timeframe.indexOf("2 Days Ago") != -1)  timeframe = -2;
         if (chlorophyll_thredds_timeframe.indexOf("3 Days Ago") != -1)  timeframe = -3;
         if (chlorophyll_thredds_timeframe.indexOf("4 Days Ago") != -1)  timeframe = -4;
         if (chlorophyll_thredds_timeframe.indexOf("5 Days Ago") != -1)  timeframe = -5;
         if (chlorophyll_thredds_timeframe.indexOf("6 Days Ago") != -1)  timeframe = -6;
         if (chlorophyll_thredds_timeframe.indexOf("7 Days Ago") != -1)  timeframe = -7;
         if (chlorophyll_thredds_timeframe.indexOf("8 Days Ago") != -1)  timeframe = -8;
         if (chlorophyll_thredds_timeframe.indexOf("9 Days Ago") != -1)  timeframe = -9;
         if (chlorophyll_thredds_timeframe.indexOf("10 Days Ago") != -1)  timeframe = -10;
         if (chlorophyll_thredds_timeframe.indexOf("11 Days Ago") != -1)  timeframe = -11;
         if (chlorophyll_thredds_timeframe.indexOf("12 Days Ago") != -1)  timeframe = -12;
         if (chlorophyll_thredds_timeframe.indexOf("13 Days Ago") != -1)  timeframe = -13;
         if (chlorophyll_thredds_timeframe.indexOf("14 Days Ago") != -1)  timeframe = -14;
         if (chlorophyll_thredds_timeframe.indexOf("15 Days Ago") != -1)  timeframe = -15;
         if (chlorophyll_thredds_timeframe.indexOf("16 Days Ago") != -1)  timeframe = -16;
         if (chlorophyll_thredds_timeframe.indexOf("17 Days Ago") != -1)  timeframe = -17;
         if (chlorophyll_thredds_timeframe.indexOf("18 Days Ago") != -1)  timeframe = -18;
         if (chlorophyll_thredds_timeframe.indexOf("19 Days Ago") != -1)  timeframe = -19;
         if (chlorophyll_thredds_timeframe.indexOf("20 Days Ago") != -1)  timeframe = -20;
         if (chlorophyll_thredds_timeframe.indexOf("21 Days Ago") != -1)  timeframe = -21;
         if (chlorophyll_thredds_timeframe.indexOf("22 Days Ago") != -1)  timeframe = -22;
         if (chlorophyll_thredds_timeframe.indexOf("23 Days Ago") != -1)  timeframe = -23;
         if (chlorophyll_thredds_timeframe.indexOf("24 Days Ago") != -1)  timeframe = -24;
         if (chlorophyll_thredds_timeframe.indexOf("25 Days Ago") != -1)  timeframe = -25;
         if (chlorophyll_thredds_timeframe.indexOf("26 Days Ago") != -1)  timeframe = -26;
         if (chlorophyll_thredds_timeframe.indexOf("27 Days Ago") != -1)  timeframe = -27;
         if (chlorophyll_thredds_timeframe.indexOf("28 Days Ago") != -1)  timeframe = -28;
         if (chlorophyll_thredds_timeframe.indexOf("29 Days Ago") != -1)  timeframe = -29;
         newDate = new Date(gmtMS + timeframe * 24 * 60 * 60 * 1000);
         mth = newDate.getMonth();
         month = mth + 1;
         day = newDate.getDate();
         year = newDate.getFullYear();
         var imageryDate = year + ((month < 10) ? "0" : "") + month + ((day < 10) ? "0" : "") + day;
         var imageFileName = "chl_3day_compo_" + imageryDate + "000000.png";
         var hrefValue = "https://service.ncddc.noaa.gov/products/NOAA_CoastWatch/" + imageFileName;
         var xminValue = -10900498.1634;
         var yminValue = 1930261.09046;
         var xmaxValue = -8755939.21331;
         var ymaxValue = 3707349.34996;
         var spatialReferenceValue = 3857;
         var lyrSample = new esri.layers.MapImageLayer();
         lyrSample.id = "Chlorophyll - NOAA";
         var lyr = new esri.layers.MapImage({'extent':{'xmin':xminValue,'ymin':yminValue,'xmax':xmaxValue,'ymax':ymaxValue,'spatialReference':{'wkid':spatialReferenceValue}},'href':hrefValue});
         lyrSample.addImage(lyr);
         map.addLayer(lyrSample); 
         var imgFile = "https://service.ncddc.noaa.gov/products/NOAA_CoastWatch/" + imageFileName;
         dojo.byId("msgChlorophyll").innerHTML = "<center><img src='images/loading-image.gif'></center>";
         var image = new Image();
         image.onload = function()  {
           dojo.byId("msgChlorophyll").innerHTML = "";
         };
         image.onerror = function()  {
           dojo.byId("msgChlorophyll").innerHTML = "Composite for this day not available";
           //dijit.byId('chlorophyll_thredds').setValue(false);
         };
         image.src = imgFile;          
       }
       // chlorophyll anomaly - NOAA CoastWatch
       if (chlorophyll_anomaly == "true")  {
         if (chlorophyll_anomaly_timeframe.indexOf("1 Day Ago") != -1)  timeframe = -1;
         if (chlorophyll_anomaly_timeframe.indexOf("2 Days Ago") != -1)  timeframe = -2;
         if (chlorophyll_anomaly_timeframe.indexOf("3 Days Ago") != -1)  timeframe = -3;
         if (chlorophyll_anomaly_timeframe.indexOf("4 Days Ago") != -1)  timeframe = -4;
         if (chlorophyll_anomaly_timeframe.indexOf("5 Days Ago") != -1)  timeframe = -5;
         if (chlorophyll_anomaly_timeframe.indexOf("6 Days Ago") != -1)  timeframe = -6;
         if (chlorophyll_anomaly_timeframe.indexOf("7 Days Ago") != -1)  timeframe = -7;
         if (chlorophyll_anomaly_timeframe.indexOf("8 Days Ago") != -1)  timeframe = -8;
         if (chlorophyll_anomaly_timeframe.indexOf("9 Days Ago") != -1)  timeframe = -9;
         if (chlorophyll_anomaly_timeframe.indexOf("10 Days Ago") != -1)  timeframe = -10;
         if (chlorophyll_anomaly_timeframe.indexOf("11 Days Ago") != -1)  timeframe = -11;
         if (chlorophyll_anomaly_timeframe.indexOf("12 Days Ago") != -1)  timeframe = -12;
         if (chlorophyll_anomaly_timeframe.indexOf("13 Days Ago") != -1)  timeframe = -13;
         if (chlorophyll_anomaly_timeframe.indexOf("14 Days Ago") != -1)  timeframe = -14;
         if (chlorophyll_anomaly_timeframe.indexOf("15 Days Ago") != -1)  timeframe = -15;
         if (chlorophyll_anomaly_timeframe.indexOf("16 Days Ago") != -1)  timeframe = -16;
         if (chlorophyll_anomaly_timeframe.indexOf("17 Days Ago") != -1)  timeframe = -17;
         if (chlorophyll_anomaly_timeframe.indexOf("18 Days Ago") != -1)  timeframe = -18;
         if (chlorophyll_anomaly_timeframe.indexOf("19 Days Ago") != -1)  timeframe = -19;
         if (chlorophyll_anomaly_timeframe.indexOf("20 Days Ago") != -1)  timeframe = -20;
         if (chlorophyll_anomaly_timeframe.indexOf("21 Days Ago") != -1)  timeframe = -21;
         if (chlorophyll_anomaly_timeframe.indexOf("22 Days Ago") != -1)  timeframe = -22;
         if (chlorophyll_anomaly_timeframe.indexOf("23 Days Ago") != -1)  timeframe = -23;
         if (chlorophyll_anomaly_timeframe.indexOf("24 Days Ago") != -1)  timeframe = -24;
         if (chlorophyll_anomaly_timeframe.indexOf("25 Days Ago") != -1)  timeframe = -25;
         if (chlorophyll_anomaly_timeframe.indexOf("26 Days Ago") != -1)  timeframe = -26;
         if (chlorophyll_anomaly_timeframe.indexOf("27 Days Ago") != -1)  timeframe = -27;
         if (chlorophyll_anomaly_timeframe.indexOf("28 Days Ago") != -1)  timeframe = -28;
         if (chlorophyll_anomaly_timeframe.indexOf("29 Days Ago") != -1)  timeframe = -29;
         newDate = new Date(gmtMS + timeframe * 24 * 60 * 60 * 1000);
         mth = newDate.getMonth();
         month = mth + 1;
         day = newDate.getDate();
         year = newDate.getFullYear();
         var imageryDate = year + ((month < 10) ? "0" : "") + month + ((day < 10) ? "0" : "") + day;
         var imageFileName = "chl_60_day_anom_" + imageryDate + "000000.png";
         var hrefValue = "https://service.ncddc.noaa.gov/products/NOAA_CoastWatch/" + imageFileName;
         var xminValue = -10900498.1634;
         var yminValue = 1930261.09046;
         var xmaxValue = -8755939.21331;
         var ymaxValue = 3707349.34996;
         var spatialReferenceValue = 3857;
         var lyrSample = new esri.layers.MapImageLayer();
         lyrSample.id = "Chlorophyll Anomaly - NOAA";
         var lyr = new esri.layers.MapImage({'extent':{'xmin':xminValue,'ymin':yminValue,'xmax':xmaxValue,'ymax':ymaxValue,'spatialReference':{'wkid':spatialReferenceValue}},'href':hrefValue});
         lyrSample.addImage(lyr);
         map.addLayer(lyrSample);
         var imgFile = "https://service.ncddc.noaa.gov/products/NOAA_CoastWatch/" + imageFileName;
         dojo.byId("msgChlorophyllAnomaly").innerHTML = "<center><img src='images/loading-image.gif'></center>";
         var image = new Image();
         image.onload = function()  {
           dojo.byId("msgChlorophyllAnomaly").innerHTML = "";
         };
         image.onerror = function()  {
           dojo.byId("msgChlorophyllAnomaly").innerHTML = "Anomaly for this day not available";
           //dijit.byId('chlorophyll_anomaly').setValue(false);
         };
         image.src = imgFile;
       }
       // monthly chlorophyll climatology - USF
       if (chl_climo_usf == "true")  {
         var imageFileName = "USF_MODIS_QUA_2003to2010_";
         imageFileName += ((chl_climo_month_usf < 10) ? "0" : "") + chl_climo_month_usf;
         imageFileName += "month_gcoos_oc.png";
         var hrefValue = "https://service.ncddc.noaa.gov/products/USF_Climatology/" + imageFileName;
         var xminValue = -10909816.0954;
         var yminValue = 2037435.47367;
         var xmaxValue = -8794340.15722;
         var ymaxValue = 3633339.47125;
         var spatialReferenceValue = 3857;
         var lyrSample = new esri.layers.MapImageLayer();
         lyrSample.id = "Monthly Chlorophyll Climatology - USF";
         var lyr = new esri.layers.MapImage({'extent':{'xmin':xminValue,'ymin':yminValue,'xmax':xmaxValue,'ymax':ymaxValue,'spatialReference':{'wkid':spatialReferenceValue}},'href':hrefValue});
         lyrSample.addImage(lyr);
         map.addLayer(lyrSample);
         var imgFile = "https://service.ncddc.noaa.gov/products/USF_Climatology/" + imageFileName;
         dojo.byId("msgUSF_Chlorophyll").innerHTML = "<center><img src='images/loading-image.gif'></center>";
         var image = new Image();
         image.onload = function()  {
           dojo.byId("msgUSF_Chlorophyll").innerHTML = "";
         };
         image.onerror = function()  {
           dojo.byId("msgUSF_Chlorophyll").innerHTML = "Monthly climatology not available";
           //dijit.byId('chl_climo_usf').setValue(false);
         };
         image.src = imgFile;
       }
       // ERGB - USF
       if (ergb_usf == "true")  {
         if (ergb_usf_timeframe.indexOf("1 Day Ago") != -1)  timeframe = -1;
         if (ergb_usf_timeframe.indexOf("2 Days Ago") != -1)  timeframe = -2;
         if (ergb_usf_timeframe.indexOf("3 Days Ago") != -1)  timeframe = -3;
         if (ergb_usf_timeframe.indexOf("4 Days Ago") != -1)  timeframe = -4;
         if (ergb_usf_timeframe.indexOf("5 Days Ago") != -1)  timeframe = -5;
         if (ergb_usf_timeframe.indexOf("6 Days Ago") != -1)  timeframe = -6;
         if (ergb_usf_timeframe.indexOf("7 Days Ago") != -1)  timeframe = -7;
         if (ergb_usf_timeframe.indexOf("8 Days Ago") != -1)  timeframe = -8;
         if (ergb_usf_timeframe.indexOf("9 Days Ago") != -1)  timeframe = -9;
         if (ergb_usf_timeframe.indexOf("10 Days Ago") != -1)  timeframe = -10;
         if (ergb_usf_timeframe.indexOf("11 Days Ago") != -1)  timeframe = -11;
         if (ergb_usf_timeframe.indexOf("12 Days Ago") != -1)  timeframe = -12;
         if (ergb_usf_timeframe.indexOf("13 Days Ago") != -1)  timeframe = -13;
         if (ergb_usf_timeframe.indexOf("14 Days Ago") != -1)  timeframe = -14;
         if (ergb_usf_timeframe.indexOf("15 Days Ago") != -1)  timeframe = -15;
         if (ergb_usf_timeframe.indexOf("16 Days Ago") != -1)  timeframe = -16;
         if (ergb_usf_timeframe.indexOf("17 Days Ago") != -1)  timeframe = -17;
         if (ergb_usf_timeframe.indexOf("18 Days Ago") != -1)  timeframe = -18;
         if (ergb_usf_timeframe.indexOf("19 Days Ago") != -1)  timeframe = -19;
         if (ergb_usf_timeframe.indexOf("20 Days Ago") != -1)  timeframe = -20;
         if (ergb_usf_timeframe.indexOf("21 Days Ago") != -1)  timeframe = -21;
         if (ergb_usf_timeframe.indexOf("22 Days Ago") != -1)  timeframe = -22;
         if (ergb_usf_timeframe.indexOf("23 Days Ago") != -1)  timeframe = -23;
         if (ergb_usf_timeframe.indexOf("24 Days Ago") != -1)  timeframe = -24;
         if (ergb_usf_timeframe.indexOf("25 Days Ago") != -1)  timeframe = -25;
         if (ergb_usf_timeframe.indexOf("26 Days Ago") != -1)  timeframe = -26;
         if (ergb_usf_timeframe.indexOf("27 Days Ago") != -1)  timeframe = -27;
         if (ergb_usf_timeframe.indexOf("28 Days Ago") != -1)  timeframe = -28;
         if (ergb_usf_timeframe.indexOf("29 Days Ago") != -1)  timeframe = -29;
         newDate = new Date(gmtMS + timeframe * 24 * 60 * 60 * 1000);
         mth = newDate.getMonth();
         month = mth + 1;
         day = newDate.getDate();
         year = newDate.getFullYear();
         var imageryDate = year + ((month < 10) ? "0" : "") + month + ((day < 10) ? "0" : "") + day;
         var imageFileName = "USF_MODIS_" + imageryDate + "_1KM_GCOOS_PASS_L3D_ERGB.png";
         var hrefValue = "https://service.ncddc.noaa.gov/products/USF_MODIS/" + imageFileName;
         var xminValue = -10909816.0954;
         var yminValue = 2037435.47367;
         var xmaxValue = -8794340.15722;
         var ymaxValue = 3633339.47125;
         var spatialReferenceValue = 3857;
         var lyrSample = new esri.layers.MapImageLayer();
         lyrSample.id = "Enhanced True Color (RGB) - USF";
         var lyr = new esri.layers.MapImage({'extent':{'xmin':xminValue,'ymin':yminValue,'xmax':xmaxValue,'ymax':ymaxValue,'spatialReference':{'wkid':spatialReferenceValue}},'href':hrefValue});
         lyrSample.addImage(lyr);
         map.addLayer(lyrSample);
         var imgFile = "https://service.ncddc.noaa.gov/products/USF_MODIS/" + imageFileName;
         dojo.byId("msgUSF_ergb").innerHTML = "<center><img src='images/loading-image.gif'></center>";
         var image = new Image();
         image.onload = function()  {
           dojo.byId("msgUSF_ergb").innerHTML = "";
         };
         image.onerror = function()  {
           dojo.byId("msgUSF_ergb").innerHTML = "ERGB for this day not available";
           //dijit.byId('ergb_usf').setValue(false);
         };
         image.src = imgFile;
       }
       // NFLH - USF
       if (nflh_usf == "true")  {
         if (nflh_usf_timeframe.indexOf("1 Day Ago") != -1)  timeframe = -1;
         if (nflh_usf_timeframe.indexOf("2 Days Ago") != -1)  timeframe = -2;
         if (nflh_usf_timeframe.indexOf("3 Days Ago") != -1)  timeframe = -3;
         if (nflh_usf_timeframe.indexOf("4 Days Ago") != -1)  timeframe = -4;
         if (nflh_usf_timeframe.indexOf("5 Days Ago") != -1)  timeframe = -5;
         if (nflh_usf_timeframe.indexOf("6 Days Ago") != -1)  timeframe = -6;
         if (nflh_usf_timeframe.indexOf("7 Days Ago") != -1)  timeframe = -7;
         if (nflh_usf_timeframe.indexOf("8 Days Ago") != -1)  timeframe = -8;
         if (nflh_usf_timeframe.indexOf("9 Days Ago") != -1)  timeframe = -9;
         if (nflh_usf_timeframe.indexOf("10 Days Ago") != -1)  timeframe = -10;
         if (nflh_usf_timeframe.indexOf("11 Days Ago") != -1)  timeframe = -11;
         if (nflh_usf_timeframe.indexOf("12 Days Ago") != -1)  timeframe = -12;
         if (nflh_usf_timeframe.indexOf("13 Days Ago") != -1)  timeframe = -13;
         if (nflh_usf_timeframe.indexOf("14 Days Ago") != -1)  timeframe = -14;
         if (nflh_usf_timeframe.indexOf("15 Days Ago") != -1)  timeframe = -15;
         if (nflh_usf_timeframe.indexOf("16 Days Ago") != -1)  timeframe = -16;
         if (nflh_usf_timeframe.indexOf("17 Days Ago") != -1)  timeframe = -17;
         if (nflh_usf_timeframe.indexOf("18 Days Ago") != -1)  timeframe = -18;
         if (nflh_usf_timeframe.indexOf("19 Days Ago") != -1)  timeframe = -19;
         if (nflh_usf_timeframe.indexOf("20 Days Ago") != -1)  timeframe = -20;
         if (nflh_usf_timeframe.indexOf("21 Days Ago") != -1)  timeframe = -21;
         if (nflh_usf_timeframe.indexOf("22 Days Ago") != -1)  timeframe = -22;
         if (nflh_usf_timeframe.indexOf("23 Days Ago") != -1)  timeframe = -23;
         if (nflh_usf_timeframe.indexOf("24 Days Ago") != -1)  timeframe = -24;
         if (nflh_usf_timeframe.indexOf("25 Days Ago") != -1)  timeframe = -25;
         if (nflh_usf_timeframe.indexOf("26 Days Ago") != -1)  timeframe = -26;
         if (nflh_usf_timeframe.indexOf("27 Days Ago") != -1)  timeframe = -27;
         if (nflh_usf_timeframe.indexOf("28 Days Ago") != -1)  timeframe = -28;
         if (nflh_usf_timeframe.indexOf("29 Days Ago") != -1)  timeframe = -29;
         newDate = new Date(gmtMS + timeframe * 24 * 60 * 60 * 1000);
         mth = newDate.getMonth();
         month = mth + 1;
         day = newDate.getDate();
         year = newDate.getFullYear();
         var imageryDate = year + ((month < 10) ? "0" : "") + month + ((day < 10) ? "0" : "") + day;
         var imageFileName = "USF_MODIS_" + imageryDate + "_1KM_GCOOS_PASS_L3D_NFLH.png";
         var hrefValue = "https://service.ncddc.noaa.gov/products/USF_MODIS/" + imageFileName;
         var xminValue = -10909816.0954;
         var yminValue = 2037435.47367;
         var xmaxValue = -8794340.15722;
         var ymaxValue = 3633339.47125;
         var spatialReferenceValue = 3857;
         var lyrSample = new esri.layers.MapImageLayer();
         lyrSample.id = "Normalized Fluorescence Line Height - USF";
         var lyr = new esri.layers.MapImage({'extent':{'xmin':xminValue,'ymin':yminValue,'xmax':xmaxValue,'ymax':ymaxValue,'spatialReference':{'wkid':spatialReferenceValue}},'href':hrefValue});
         lyrSample.addImage(lyr);
         map.addLayer(lyrSample);
         var imgFile = "https://service.ncddc.noaa.gov/products/USF_MODIS/" + imageFileName;
         dojo.byId("msgUSF_nflh").innerHTML = "<center><img src='images/loading-image.gif'></center>";
         var image = new Image();
         image.onload = function()  {
           dojo.byId("msgUSF_nflh").innerHTML = "";
         };
         image.onerror = function()  {
           dojo.byId("msgUSF_nflh").innerHTML = "NFLH for this day not available";
           //dijit.byId('nflh_usf').setValue(false);
         };
         image.src = imgFile;
       }
       // SST - USF
       if (sst_usf == "true")  {
         if (sst_usf_timeframe.indexOf("1 Day Ago") != -1)  timeframe = -1;
         if (sst_usf_timeframe.indexOf("2 Days Ago") != -1)  timeframe = -2;
         if (sst_usf_timeframe.indexOf("3 Days Ago") != -1)  timeframe = -3;
         if (sst_usf_timeframe.indexOf("4 Days Ago") != -1)  timeframe = -4;
         if (sst_usf_timeframe.indexOf("5 Days Ago") != -1)  timeframe = -5;
         if (sst_usf_timeframe.indexOf("6 Days Ago") != -1)  timeframe = -6;
         if (sst_usf_timeframe.indexOf("7 Days Ago") != -1)  timeframe = -7;
         if (sst_usf_timeframe.indexOf("8 Days Ago") != -1)  timeframe = -8;
         if (sst_usf_timeframe.indexOf("9 Days Ago") != -1)  timeframe = -9;
         if (sst_usf_timeframe.indexOf("10 Days Ago") != -1)  timeframe = -10;
         if (sst_usf_timeframe.indexOf("11 Days Ago") != -1)  timeframe = -11;
         if (sst_usf_timeframe.indexOf("12 Days Ago") != -1)  timeframe = -12;
         if (sst_usf_timeframe.indexOf("13 Days Ago") != -1)  timeframe = -13;
         if (sst_usf_timeframe.indexOf("14 Days Ago") != -1)  timeframe = -14;
         if (sst_usf_timeframe.indexOf("15 Days Ago") != -1)  timeframe = -15;
         if (sst_usf_timeframe.indexOf("16 Days Ago") != -1)  timeframe = -16;
         if (sst_usf_timeframe.indexOf("17 Days Ago") != -1)  timeframe = -17;
         if (sst_usf_timeframe.indexOf("18 Days Ago") != -1)  timeframe = -18;
         if (sst_usf_timeframe.indexOf("19 Days Ago") != -1)  timeframe = -19;
         if (sst_usf_timeframe.indexOf("20 Days Ago") != -1)  timeframe = -20;
         if (sst_usf_timeframe.indexOf("21 Days Ago") != -1)  timeframe = -21;
         if (sst_usf_timeframe.indexOf("22 Days Ago") != -1)  timeframe = -22;
         if (sst_usf_timeframe.indexOf("23 Days Ago") != -1)  timeframe = -23;
         if (sst_usf_timeframe.indexOf("24 Days Ago") != -1)  timeframe = -24;
         if (sst_usf_timeframe.indexOf("25 Days Ago") != -1)  timeframe = -25;
         if (sst_usf_timeframe.indexOf("26 Days Ago") != -1)  timeframe = -26;
         if (sst_usf_timeframe.indexOf("27 Days Ago") != -1)  timeframe = -27;
         if (sst_usf_timeframe.indexOf("28 Days Ago") != -1)  timeframe = -28;
         if (sst_usf_timeframe.indexOf("29 Days Ago") != -1)  timeframe = -29;
         newDate = new Date(gmtMS + timeframe * 24 * 60 * 60 * 1000);
         mth = newDate.getMonth();
         month = mth + 1;
         day = newDate.getDate();
         year = newDate.getFullYear();
         var imageryDate = year + ((month < 10) ? "0" : "") + month + ((day < 10) ? "0" : "") + day;
         var imageFileName = "USF_MODIS_" + imageryDate + "_1KM_GCOOS_PASS_L3D_SST.png";
         var hrefValue = "https://service.ncddc.noaa.gov/products/USF_MODIS/" + imageFileName;
         var xminValue = -10909816.0954;
         var yminValue = 2037435.47367;
         var xmaxValue = -8794340.15722;
         var ymaxValue = 3633339.47125;
         var spatialReferenceValue = 3857;
         var lyrSample = new esri.layers.MapImageLayer();
         lyrSample.id = "Sea Surface Temperatures - USF";
         var lyr = new esri.layers.MapImage({'extent':{'xmin':xminValue,'ymin':yminValue,'xmax':xmaxValue,'ymax':ymaxValue,'spatialReference':{'wkid':spatialReferenceValue}},'href':hrefValue});
         lyrSample.addImage(lyr);
         map.addLayer(lyrSample);
         var imgFile = "https://service.ncddc.noaa.gov/products/USF_MODIS/" + imageFileName;
         dojo.byId("msgUSF_sst").innerHTML = "<center><img src='images/loading-image.gif'></center>";
         var image = new Image();
         image.onload = function()  {
           dojo.byId("msgUSF_sst").innerHTML = "";
         };
         image.onerror = function()  {
           dojo.byId("msgUSF_sst").innerHTML = "SST for this day not available";
           //dijit.byId('sst_usf').setValue(false);
         };
         image.src = imgFile;
       }

       // air temperature from NWS (NDFD)
       if (atmp == "true")  {
         dojo.byId("msgMetModels_atmp").innerHTML = "";
         if (!results[queryID][0])  {
           dojo.byId("msgMetModels_atmp").innerHTML = "<center>Server error ... Try again later</center>";
           dijit.byId('atmp').setValue(false);
         }
         else {
           var featureCount = results[queryID][1].features;
           if (featureCount.length != 0)  {
             dojo.byId("msgMetModels_atmp").innerHTML = "";
             if (atmp_forecast.indexOf("24 Hr Forecast") != -1)  forecast = 24; 
             if (atmp_forecast.indexOf("48 Hr Forecast") != -1)  forecast = 48; 
             if (atmp_forecast.indexOf("72 Hr Forecast") != -1)  forecast = 72;
             var time = forecast / 24;
             newDate = new Date(gmtMS + time * 24 * 60 * 60 * 1000);
             mth = newDate.getMonth();
             day = newDate.getDate();
             year = newDate.getFullYear();
             var forecastDate = year + "-" + abbrMonthsArray[mth] + "-" + ((day < 10) ? "0" : "") + day;
             var month = mth + 1;
             var dateParameter = "vdate like '%";
             dateParameter += year + "/" + ((month < 10) ? "0" : "") + month + "/" + ((day < 10) ? "0" : "") + day + "-00Z";
             dateParameter += "%'";
             var imageParameters = new esri.layers.ImageParameters();
             var layerDefs = [];
             if (forecast == 24)  layerDefs[1] = dateParameter;
             if (forecast == 48)  layerDefs[2] = dateParameter;
             if (forecast == 72)  layerDefs[3] = dateParameter;
             imageParameters.layerDefinitions = layerDefs;
             if (forecast == 24)  imageParameters.layerIds = [0,1];
             if (forecast == 48)  imageParameters.layerIds = [0,2];
             if (forecast == 72)  imageParameters.layerIds = [0,3];
             imageParameters.layerOption = esri.layers.ImageParameters.LAYER_OPTION_SHOW;
             imageParameters.transparent = true;
             imageParameters.format = "png32";
             var lyr = new esri.layers.ArcGISDynamicMapServiceLayer("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/NWS_AirTempForecasts/MapServer", {"imageParameters":imageParameters,"opacity":0.95});
             lyr.id = "Air Temperatures - NWS";
             map.addLayer(lyr);
           }
           else  {
             dojo.byId("msgMetModels_atmp").innerHTML = "No air temperature for this date";
             dijit.byId('atmp').setValue(false);
           }
         }
         queryID = queryID + 1;           
       }
       // percent precipitation from NWS (NDFD)
       if (pop12 == "true")  {
         dojo.byId("msgMetModels_pop12").innerHTML = "";
         if (!results[queryID][0])  {
           dojo.byId("msgMetModels_pop12").innerHTML = "<center>Server error ... Try again later</center>";
           dijit.byId('pop12').setValue(false);
         }
         else  {
           var featureCount = results[queryID][1].features;
           if (featureCount.length != 0)  {
             dojo.byId("msgMetModels_pop12").innerHTML = "";
             if (pop12_forecast.indexOf("24 Hr Forecast") != -1)  forecast = 24;
             if (pop12_forecast.indexOf("48 Hr Forecast") != -1)  forecast = 48;
             if (pop12_forecast.indexOf("72 Hr Forecast") != -1)  forecast = 72;
             var time = forecast / 24;
             newDate = new Date(gmtMS + time * 24 * 60 * 60 * 1000);
             mth = newDate.getMonth();
             day = newDate.getDate();
             year = newDate.getFullYear();
             var forecastDate = year + "-" + abbrMonthsArray[mth] + "-" + ((day < 10) ? "0" : "") + day;
             var month = mth + 1;
             var dateParameter = "vdate like '%";
             dateParameter += year + "/" + ((month < 10) ? "0" : "") + month + "/" + ((day < 10) ? "0" : "") + day + "-00Z";
             dateParameter += "%'";
             var imageParameters = new esri.layers.ImageParameters();
             var layerDefs = [];
             if (forecast == 24)  layerDefs[1] = dateParameter;
             if (forecast == 48)  layerDefs[2] = dateParameter;
             if (forecast == 72)  layerDefs[3] = dateParameter;
             imageParameters.layerDefinitions = layerDefs;
             if (forecast == 24)  imageParameters.layerIds = [0,1];
             if (forecast == 48)  imageParameters.layerIds = [0,2];
             if (forecast == 72)  imageParameters.layerIds = [0,3];
             imageParameters.layerOption = esri.layers.ImageParameters.LAYER_OPTION_SHOW;
             imageParameters.transparent = true;
             imageParameters.format = "png32";
             var lyr = new esri.layers.ArcGISDynamicMapServiceLayer("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/NWS_PercentPrecipitationForecasts/MapServer", {"imageParameters":imageParameters,"opacity":0.95});
             lyr.id = "Probability of Precipitation - NWS";
             map.addLayer(lyr);
           }
           else  {
             dojo.byId("msgMetModels_pop12").innerHTML = "No precipitation probability for this date";
             dijit.byId('pop12').setValue(false);
           }
         }
         queryID = queryID + 1;
       }
       // precipitation amount from NWS (NDFD)
       if (qpf == "true")  {
         dojo.byId("msgMetModels_qpf").innerHTML = "";
         if (!results[queryID][0])  {
           dojo.byId("msgMetModels_qpf").innerHTML = "<center>Server error ... Try again later</center>";
           dijit.byId('qpf').setValue(false);
         }
         else  {
           var featureCount = results[queryID][1].features;
           if (featureCount.length != 0)  {
             dojo.byId("msgMetModels_qpf").innerHTML = "";
             if (qpf_forecast.indexOf("24 Hr Forecast") != -1)  forecast = 24;
             if (qpf_forecast.indexOf("48 Hr Forecast") != -1)  forecast = 48;
             if (qpf_forecast.indexOf("72 Hr Forecast") != -1)  forecast = 72;
             var time = forecast / 24;
             newDate = new Date(gmtMS + time * 24 * 60 * 60 * 1000);
             mth = newDate.getMonth();
             day = newDate.getDate();
             year = newDate.getFullYear();
             var forecastDate = year + "-" + abbrMonthsArray[mth] + "-" + ((day < 10) ? "0" : "") + day;
             var month = mth + 1;
             var dateParameter = "vdate like '%";
             dateParameter += year + "/" + ((month < 10) ? "0" : "") + month + "/" + ((day < 10) ? "0" : "") + day + "-00Z";
             dateParameter += "%'";
             var imageParameters = new esri.layers.ImageParameters();
             var layerDefs = [];
             if (forecast == 24)  layerDefs[1] = dateParameter;
             if (forecast == 48)  layerDefs[2] = dateParameter;
             if (forecast == 72)  layerDefs[3] = dateParameter;
             imageParameters.layerDefinitions = layerDefs;
             if (forecast == 24)  imageParameters.layerIds = [0,1];
             if (forecast == 48)  imageParameters.layerIds = [0,2];
             if (forecast == 72)  imageParameters.layerIds = [0,3];
             imageParameters.layerOption = esri.layers.ImageParameters.LAYER_OPTION_SHOW;
             imageParameters.transparent = true;
             imageParameters.format = "png32";
             var lyr = new esri.layers.ArcGISDynamicMapServiceLayer("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/NWS_PrecipitationAmountForecasts/MapServer", {"imageParameters":imageParameters,"opacity":0.95});
             lyr.id = "Precipitation Amounts - NWS";
             map.addLayer(lyr);
           }
           else  {
             dojo.byId("msgMetModels_qpf").innerHTML = "No precipitation amounts for this date";
             dijit.byId('qpf').setValue(false);
           }
         }
         queryID = queryID + 1;
       }
       // sea surface heights (AMSEAS model)
       if (ssh_forecast == "true")  {
         dojo.byId("msgOcnModels_ssh").innerHTML = "";
         if (!results[queryID][0])  {
           dojo.byId("msgOcnModels_ssh").innerHTML = "<center>Server error ... Try again later</center>";
           dijit.byId('ssh_forecast').setValue(false);
         }
         else  {
           var featureCount = results[queryID][1].features;
           if (featureCount.length != 0)  {
             dojo.byId("msgOcnModels_ssh").innerHTML = "";
             if (ssh_timeframe.indexOf("Today") != -1)  timeframe = 0;
             if (ssh_timeframe.indexOf("24 Hr Forecast") != -1)  timeframe = 1;
             if (ssh_timeframe.indexOf("48 Hr Forecast") != -1)  timeframe = 2;
             if (ssh_timeframe.indexOf("1 Day Ago") != -1)  timeframe = -1;
             if (ssh_timeframe.indexOf("2 Days Ago") != -1)  timeframe = -2;
             if (ssh_timeframe.indexOf("3 Days Ago") != -1)  timeframe = -3;
             if (ssh_timeframe.indexOf("4 Days Ago") != -1)  timeframe = -4;
             if (ssh_timeframe.indexOf("5 Days Ago") != -1)  timeframe = -5;
             if (ssh_timeframe.indexOf("6 Days Ago") != -1)  timeframe = -6;
             if (ssh_timeframe.indexOf("7 Days Ago") != -1)  timeframe = -7;
             if (ssh_timeframe.indexOf("8 Days Ago") != -1)  timeframe = -8;
             if (ssh_timeframe.indexOf("9 Days Ago") != -1)  timeframe = -9;
             if (ssh_timeframe.indexOf("10 Days Ago") != -1)  timeframe = -10;
             if (ssh_timeframe.indexOf("11 Days Ago") != -1)  timeframe = -11;
             if (ssh_timeframe.indexOf("12 Days Ago") != -1)  timeframe = -12;
             if (ssh_timeframe.indexOf("13 Days Ago") != -1)  timeframe = -13;
             if (ssh_timeframe.indexOf("14 Days Ago") != -1)  timeframe = -14;
             if (ssh_timeframe.indexOf("15 Days Ago") != -1)  timeframe = -15;
             if (ssh_timeframe.indexOf("16 Days Ago") != -1)  timeframe = -16;
             if (ssh_timeframe.indexOf("17 Days Ago") != -1)  timeframe = -17;
             if (ssh_timeframe.indexOf("18 Days Ago") != -1)  timeframe = -18;
             if (ssh_timeframe.indexOf("19 Days Ago") != -1)  timeframe = -19;
             if (ssh_timeframe.indexOf("20 Days Ago") != -1)  timeframe = -20;
             if (ssh_timeframe.indexOf("21 Days Ago") != -1)  timeframe = -21;
             if (ssh_timeframe.indexOf("22 Days Ago") != -1)  timeframe = -22;
             if (ssh_timeframe.indexOf("23 Days Ago") != -1)  timeframe = -23;
             if (ssh_timeframe.indexOf("24 Days Ago") != -1)  timeframe = -24;
             if (ssh_timeframe.indexOf("25 Days Ago") != -1)  timeframe = -25;
             if (ssh_timeframe.indexOf("26 Days Ago") != -1)  timeframe = -26;
             if (ssh_timeframe.indexOf("27 Days Ago") != -1)  timeframe = -27;
             if (ssh_timeframe.indexOf("28 Days Ago") != -1)  timeframe = -28;
             if (ssh_timeframe.indexOf("29 Days Ago") != -1)  timeframe = -29;
             newDate = new Date(gmtMS + timeframe * 24 * 60 * 60 * 1000);
             mth = newDate.getMonth();
             day = newDate.getDate();
             year = newDate.getFullYear();
             var forecastDate = year + "-" + abbrMonthsArray[mth] + "-" + ((day < 10) ? "0" : "") + day;
             var imageParameters = new esri.layers.ImageParameters();
             imageParameters.format = "png32";
             if (timeframe >= 0)  {
               mth = today.getMonth();
               day = today.getDate();
               year = today.getFullYear();
               month = mth + 1;
               var dateParameter = "date_='";
               dateParameter += year + "/" + ((month < 10) ? "0" : "") + month + "/" + ((day < 10) ? "0" : "") + day;
               dateParameter += "' AND time='";
               if (timeframe == 0)  dateParameter += "00hr'";
               if (timeframe == 1)  dateParameter += "24hr'";
               if (timeframe == 2)  dateParameter += "48hr'";
               var layerDefs = [];
               layerDefs[timeframe] = dateParameter;
               imageParameters.layerDefinitions = layerDefs;
               imageParameters.layerIds = [timeframe];
               imageParameters.layerOption = esri.layers.ImageParameters.LAYER_OPTION_SHOW;
               imageParameters.transparent = true;
               var lyr = new esri.layers.ArcGISDynamicMapServiceLayer("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/IASNFS_SeaSurfaceHeightForecasts/MapServer", {"imageParameters":imageParameters,"opacity":0.95});
               lyr.id = "Sea Surface Heights - AMSEAS";
             }
             else  {
               timeframe = (timeframe * -1) - 1;
               month = mth + 1;
               var dateParameter = "date_='";
               dateParameter += year + ((month < 10) ? "0" : "") + month + ((day < 10) ? "0" : "") + day;
               dateParameter += "'"; 
               var layerDefs = [];
               layerDefs[timeframe] = dateParameter;
               imageParameters.layerDefinitions = layerDefs;
               imageParameters.layerIds = [timeframe];
               imageParameters.layerOption = esri.layers.ImageParameters.LAYER_OPTION_SHOW;
               imageParameters.transparent = true;
               var lyr = new esri.layers.ArcGISDynamicMapServiceLayer("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/AMSEAS_SeaSurfaceHeight_Hindcasts/MapServer", {"imageParameters":imageParameters,"opacity":0.95});
               lyr.id = "Sea Surface Heights - AMSEAS";
             }
             map.addLayer(lyr);
           }
           else  {
             if (timeframe >= 0)  {
               dojo.byId("msgOcnModels_ssh").innerHTML = "Forecast of sea surface height not available yet .. Try later";
             }
             else  {
               dojo.byId("msgOcnModels_ssh").innerHTML = "No sea surface heights for this date";
             }
             dijit.byId('ssh_forecast').setValue(false);
           }
         }
         queryID = queryID + 1;     
       }
       // sea surface salinity (AMSEAS model)
       if (sss_forecast == "true")  {
         dojo.byId("msgOcnModels_sss").innerHTML = "";
         if (!results[queryID][0])  {
           dojo.byId("msgOcnModels_sss").innerHTML = "<center>Server error ... Try again later</center>";
           dijit.byId('sss_forecast').setValue(false);
         }
         else  {
           var featureCount = results[queryID][1].features;
           if (featureCount.length != 0)  {
             if (sss_timeframe.indexOf("Today") != -1)  timeframe = 0;
             if (sss_timeframe.indexOf("24 Hr Forecast") != -1)  timeframe = 1;
             if (sss_timeframe.indexOf("48 Hr Forecast") != -1)  timeframe = 2;
             if (sss_timeframe.indexOf("1 Day Ago") != -1)  timeframe = -1;
             if (sss_timeframe.indexOf("2 Days Ago") != -1)  timeframe = -2;
             if (sss_timeframe.indexOf("3 Days Ago") != -1)  timeframe = -3;
             if (sss_timeframe.indexOf("4 Days Ago") != -1)  timeframe = -4;
             if (sss_timeframe.indexOf("5 Days Ago") != -1)  timeframe = -5;
             if (sss_timeframe.indexOf("6 Days Ago") != -1)  timeframe = -6;
             if (sss_timeframe.indexOf("7 Days Ago") != -1)  timeframe = -7;
             if (sss_timeframe.indexOf("8 Days Ago") != -1)  timeframe = -8;
             if (sss_timeframe.indexOf("9 Days Ago") != -1)  timeframe = -9;
             if (sss_timeframe.indexOf("10 Days Ago") != -1)  timeframe = -10;
             if (sss_timeframe.indexOf("11 Days Ago") != -1)  timeframe = -11;
             if (sss_timeframe.indexOf("12 Days Ago") != -1)  timeframe = -12;
             if (sss_timeframe.indexOf("13 Days Ago") != -1)  timeframe = -13;
             if (sss_timeframe.indexOf("14 Days Ago") != -1)  timeframe = -14;
             if (sss_timeframe.indexOf("15 Days Ago") != -1)  timeframe = -15;
             if (sss_timeframe.indexOf("16 Days Ago") != -1)  timeframe = -16;
             if (sss_timeframe.indexOf("17 Days Ago") != -1)  timeframe = -17;
             if (sss_timeframe.indexOf("18 Days Ago") != -1)  timeframe = -18;
             if (sss_timeframe.indexOf("19 Days Ago") != -1)  timeframe = -19;
             if (sss_timeframe.indexOf("20 Days Ago") != -1)  timeframe = -20;
             if (sss_timeframe.indexOf("21 Days Ago") != -1)  timeframe = -21;
             if (sss_timeframe.indexOf("22 Days Ago") != -1)  timeframe = -22;
             if (sss_timeframe.indexOf("23 Days Ago") != -1)  timeframe = -23;
             if (sss_timeframe.indexOf("24 Days Ago") != -1)  timeframe = -24;
             if (sss_timeframe.indexOf("25 Days Ago") != -1)  timeframe = -25;
             if (sss_timeframe.indexOf("26 Days Ago") != -1)  timeframe = -26;
             if (sss_timeframe.indexOf("27 Days Ago") != -1)  timeframe = -27;
             if (sss_timeframe.indexOf("28 Days Ago") != -1)  timeframe = -28;
             if (sss_timeframe.indexOf("29 Days Ago") != -1)  timeframe = -29;
             newDate = new Date(gmtMS + timeframe * 24 * 60 * 60 * 1000);
             mth = newDate.getMonth();
             day = newDate.getDate();
             year = newDate.getFullYear();
             var forecastDate = year + "-" + abbrMonthsArray[mth] + "-" + ((day < 10) ? "0" : "") + day;
             var imageParameters = new esri.layers.ImageParameters();
             imageParameters.format = "png32";
             if (timeframe >= 0)  {
               mth = today.getMonth();
               day = today.getDate();
               year = today.getFullYear();
               month = mth + 1;
               var dateParameter = "date_='";
               dateParameter += year + "/" + ((month < 10) ? "0" : "") + month + "/" + ((day < 10) ? "0" : "") + day;
               dateParameter += "' AND time='";
               if (timeframe == 0)  dateParameter += "00hr'";
               if (timeframe == 1)  dateParameter += "24hr'";
               if (timeframe == 2)  dateParameter += "48hr'";
               var layerDefs = [];
               layerDefs[timeframe] = dateParameter;
               imageParameters.layerDefinitions = layerDefs;
               imageParameters.layerIds = [timeframe];
               imageParameters.layerOption = esri.layers.ImageParameters.LAYER_OPTION_SHOW;
               imageParameters.transparent = true;
               var lyr = new esri.layers.ArcGISDynamicMapServiceLayer("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/IASNFS_SeaSurfaceSalinityForecasts/MapServer", {"imageParameters":imageParameters,"opacity":0.95});
               lyr.id = "Sea Surface Salinities - AMSEAS";
             }
             else  {
               timeframe = (timeframe * -1) - 1;
               month = mth + 1;
               var dateParameter = "date_='";
               dateParameter += year + ((month < 10) ? "0" : "") + month + ((day < 10) ? "0" : "") + day;
               dateParameter += "'"; 
               var layerDefs = [];
               layerDefs[timeframe] = dateParameter;
               imageParameters.layerDefinitions = layerDefs;
               imageParameters.layerIds = [timeframe];
               imageParameters.layerOption = esri.layers.ImageParameters.LAYER_OPTION_SHOW;
               imageParameters.transparent = true;
               var lyr = new esri.layers.ArcGISDynamicMapServiceLayer("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/AMSEAS_SeaSurfaceSalinity_Hindcasts/MapServer", {"imageParameters":imageParameters,"opacity":0.95});
               lyr.id = "Sea Surface Salinities - AMSEAS";
             }
             map.addLayer(lyr);
           }
           else  {
             if (timeframe >= 0)  {
               dojo.byId("msgOcnModels_sss").innerHTML = "Forecast of sea surface salinity not available yet .. Try later";
             }
             else {
               dojo.byId("msgOcnModels_sss").innerHTML = "No sea surface salinities for this date";
             }
             dijit.byId('sss_forecast').setValue(false);
           }
         }
         queryID = queryID + 1;
       }
       // surface water temperatures (AMSEAS model)
       if (sst_forecast == "true")  {
         dojo.byId("msgOcnModels_sst").innerHTML = "";
         if (!results[queryID][0])  {
           dojo.byId("msgOcnModels_sst").innerHTML = "<center>Server error ... Try again later</center>";
           dijit.byId('sst_forecast').setValue(false);
         }
         else  {
           var featureCount = results[queryID][1].features;
           if (featureCount.length != 0)  {
             if (sst_timeframe.indexOf("Today") != -1)  timeframe = 0;
             if (sst_timeframe.indexOf("24 Hr Forecast") != -1)  timeframe = 1;
             if (sst_timeframe.indexOf("48 Hr Forecast") != -1)  timeframe = 2;
             if (sst_timeframe.indexOf("1 Day Ago") != -1)  timeframe = -1;
             if (sst_timeframe.indexOf("2 Days Ago") != -1)  timeframe = -2;
             if (sst_timeframe.indexOf("3 Days Ago") != -1)  timeframe = -3;
             if (sst_timeframe.indexOf("4 Days Ago") != -1)  timeframe = -4;
             if (sst_timeframe.indexOf("5 Days Ago") != -1)  timeframe = -5;
             if (sst_timeframe.indexOf("6 Days Ago") != -1)  timeframe = -6;
             if (sst_timeframe.indexOf("7 Days Ago") != -1)  timeframe = -7;
             if (sst_timeframe.indexOf("8 Days Ago") != -1)  timeframe = -8;
             if (sst_timeframe.indexOf("9 Days Ago") != -1)  timeframe = -9;
             if (sst_timeframe.indexOf("10 Days Ago") != -1)  timeframe = -10;
             if (sst_timeframe.indexOf("11 Days Ago") != -1)  timeframe = -11;
             if (sst_timeframe.indexOf("12 Days Ago") != -1)  timeframe = -12;
             if (sst_timeframe.indexOf("13 Days Ago") != -1)  timeframe = -13;
             if (sst_timeframe.indexOf("14 Days Ago") != -1)  timeframe = -14;
             if (sst_timeframe.indexOf("15 Days Ago") != -1)  timeframe = -15;
             if (sst_timeframe.indexOf("16 Days Ago") != -1)  timeframe = -16;
             if (sst_timeframe.indexOf("17 Days Ago") != -1)  timeframe = -17;
             if (sst_timeframe.indexOf("18 Days Ago") != -1)  timeframe = -18;
             if (sst_timeframe.indexOf("19 Days Ago") != -1)  timeframe = -19;
             if (sst_timeframe.indexOf("20 Days Ago") != -1)  timeframe = -20;
             if (sst_timeframe.indexOf("21 Days Ago") != -1)  timeframe = -21;
             if (sst_timeframe.indexOf("22 Days Ago") != -1)  timeframe = -22;
             if (sst_timeframe.indexOf("23 Days Ago") != -1)  timeframe = -23;
             if (sst_timeframe.indexOf("24 Days Ago") != -1)  timeframe = -24;
             if (sst_timeframe.indexOf("25 Days Ago") != -1)  timeframe = -25;
             if (sst_timeframe.indexOf("26 Days Ago") != -1)  timeframe = -26;
             if (sst_timeframe.indexOf("27 Days Ago") != -1)  timeframe = -27;
             if (sst_timeframe.indexOf("28 Days Ago") != -1)  timeframe = -28;
             if (sst_timeframe.indexOf("29 Days Ago") != -1)  timeframe = -29;
             newDate = new Date(gmtMS + timeframe * 24 * 60 * 60 * 1000);
             mth = newDate.getMonth();
             day = newDate.getDate();
             year = newDate.getFullYear();
             var forecastDate = year + "-" + abbrMonthsArray[mth] + "-" + ((day < 10) ? "0" : "") + day;
             var imageParameters = new esri.layers.ImageParameters();
             imageParameters.format = "png32";
             if (timeframe >= 0)  {
               mth = today.getMonth();
               day = today.getDate();
               year = today.getFullYear();
               month = mth + 1;
               var dateParameter = "date_='";
               dateParameter += year + "/" + ((month < 10) ? "0" : "") + month + "/" + ((day < 10) ? "0" : "") + day;
               dateParameter += "' AND time='";
               if (timeframe == 0)  dateParameter += "00hr'";
               if (timeframe == 1)  dateParameter += "24hr'";
               if (timeframe == 2)  dateParameter += "48hr'";
               var layerDefs = [];
               layerDefs[timeframe] = dateParameter;
               imageParameters.layerDefinitions = layerDefs;
               imageParameters.layerIds = [timeframe];
               imageParameters.layerOption = esri.layers.ImageParameters.LAYER_OPTION_SHOW;
               imageParameters.transparent = true;
               var lyr = new esri.layers.ArcGISDynamicMapServiceLayer("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/IASNFS_WaterTempForecasts/MapServer", {"imageParameters":imageParameters,"opacity":0.95});
               lyr.id = "Water Temperatures - AMSEAS";
             }
             else  {
               timeframe = (timeframe * -1) - 1;
               month = mth + 1;
               var dateParameter = "date_='";
               dateParameter += year + ((month < 10) ? "0" : "") + month + ((day < 10) ? "0" : "") + day;
               dateParameter += "'"; 
               var layerDefs = [];
               layerDefs[timeframe] = dateParameter;
               imageParameters.layerDefinitions = layerDefs;
               imageParameters.layerIds = [timeframe];
               imageParameters.layerOption = esri.layers.ImageParameters.LAYER_OPTION_SHOW;
               imageParameters.transparent = true;
               var lyr = new esri.layers.ArcGISDynamicMapServiceLayer("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/AMSEAS_WaterTemp_Hindcasts/MapServer", {"imageParameters":imageParameters,"opacity":0.95});
               lyr.id = "Water Temperatures - AMSEAS";  
             }
             map.addLayer(lyr);
           }
           else  {
             if (timeframe >= 0)  {
               dojo.byId("msgOcnModels_sst").innerHTML = "Forecast of water temperature not available yet ... Try later";
             }
             else  {
               dojo.byId("msgOcnModels_sst").innerHTML = "No water temperatures for this date";
             }
             dijit.byId('sst_forecast').setValue(false);
           }
         }
         queryID = queryID + 1;
       }
       // weather radar from NWS  ... had to remove msg due to change in map service in 2015
       if (weatherRadar == "true")  {
       //  dojo.byId("msgWeatherRadar").innerHTML = "";
       //  if (!results[queryID][0])  {
       //    dojo.byId("msgWeatherRadar").innerHTML = "<center>Server error ... Try again later</center>";
       //    dijit.byId('weatherRadar').setValue(false);
       //  }
       //  else  {
       //    var featureCount = results[queryID][1].features;
       //    if (featureCount.length != 0)  {
             var imageParameters = new esri.layers.ImageParameters();
             imageParameters.format = "png32";
             //var lyr = new esri.layers.ArcGISDynamicMapServiceLayer("http://gis.srh.noaa.gov/ArcGIS/rest/services/Radar_warnings/MapServer",{"imageParameters":imageParameters,"opacity":0.95});
             //lyr.setVisibleLayers([2]);
             var lyr = new esri.layers.ArcGISDynamicMapServiceLayer("https://idpgis.ncep.noaa.gov/arcgis/rest/services/NWS_Observations/radar_base_reflectivity/MapServer",{"imageParameters":imageParameters,"opacity":0.95});
             lyr.setVisibleLayers([3]);
             lyr.id = "Weather Radar";
             map.addLayer(lyr);
       //    }
       //    else  {
       //      dojo.byId("msgWeatherRadar").innerHTML = "No weather radar for this date";
       //      dijit.byId('weatherRadar').setValue(false);
       //    }
       //  }
       //  queryID = queryID + 1;           
       }
       // respiratory irritation forecast from HAB-OF not yet available ... BSG
       //if (respiratoryIrritation == "true")  {
       //  dojo.byId("msgIrritationForecasts").innerHTML = "";
       //  if (!results[queryID][0])  {
       //    dojo.byId("msgIrritationForecasts").innerHTML = "<center>Server error .. Try again later</center>";
       //    dijit.byId('ri_forecast').setValue(false);
       //  }
       //  else {
       //    var featureCount = results[queryID][1].features;
       //    if (featureCount.length != 0)  {
       //      var imageParameters = new esri.layers.ImageParameters();
       //      imageParameters.format = "png32";
       //      var lyr = new esri.layers.ArcGISDynamicMapServiceLayer("https://service.ncddc.noaa.gov/arcgis/rest/services/EnvironmentalMonitoring/HABSOSViewBase/MapServer",{"imageParameters":imageParameters, "opacity":0.95});
       //      lyr.setVisibleLayers([4]);
       //      lyr.id = "Respiratory Irritation Forecast";
       //      map.addLayer(lyr);
       //    }
       //    else  {
       //      dojo.byId("msgIrritationForecasts").innerHTML = "No respiratory irritation forecast for today";
       //      dijit.byId('ri_forecast').setValue(false);
       //    }
       //  }
       //  queryID = queryID + 1; 
       //}

       // graticule from NGDC
       if (graticule == "true")  {
         dojo.byId("msgGrid").innerHTML = "";
         if (!results[queryID][0])  {
           dojo.byId("msgGrid").innerHTML = "<center>Server error ... Try again later</center>";
           dijit.byId('graticule').setValue(false);
         }
         else  {
           var featureCount = results[queryID][1].features;
           if (featureCount.length != 0)  {
             var imageParameters = new esri.layers.ImageParameters();
             imageParameters.format = "png32";
             var lyr = new esri.layers.ArcGISDynamicMapServiceLayer("https://gis.ngdc.noaa.gov/arcgis/rest/services/web_mercator/graticule/MapServer",{"imageParameters":imageParameters});
             lyr.id = "Graticule";
             map.addLayer(lyr);
           }
           else  {
             dojo.byId("msgGrid").innerHTML = "Map service for graticule unavailable";
             dijit.byId('graticule').setValue(false);
           }
         }
         queryID = queryID + 1;
       }
       // bathymetry from NGDC
       if (bathymetry == "true")  {
         dojo.byId("msgBathy").innerHTML = "";
         if (!results[queryID][0])  {
           dojo.byId("msgBathy").innerHTML = "<center>Server error ... Try again later</center>";
           dijit.byId('bathymetry').setValue(false);
         }
         else  {
           var featureCount = results[queryID][1].features;
           if (featureCount.length != 0)  {
             var imageParameters = new esri.layers.ImageParameters();
             imageParameters.format = "png32";
             var lyr = new esri.layers.ArcGISDynamicMapServiceLayer("https://gis.ngdc.noaa.gov/arcgis/rest/services/GulfDataAtlas/NGDC_BathymetricContours_General/MapServer",{"imageParameters":imageParameters, "opacity":0.95});
             lyr.id = "Bathymetry";
             map.addLayer(lyr);
           }
           else  {
             dojo.byId("msgBathy").innerHTML = "Map service for bathymetry unavailable";
             dijit.byId('bathymetry').setValue(false);
           }
         }
         queryID = queryID + 1;
       }
       // monthly mean surface water temperature from NODC World Ocean Atlas (2005)
       if (wtmp == "true")  {
         dojo.byId("msgOcnWTmp").innerHTML = "";
         if (!results[queryID][0])  {
           dojo.byId("msgOcnWTmp").innerHTML = "<center>Server error ... Try again later</center>";
           dijit.byId('wtmp').setValue(false);
         }
         else  {
           var featureCount = results[queryID][1].features;
           if (featureCount.length != 0)  {
             var imageParameters = new esri.layers.ImageParameters();
             var layerDefs = [];
             layerDefs[wtmp_month] = "depth='SURFACE'";
             imageParameters.layerDefinitions = layerDefs;
             imageParameters.layerIds = [wtmp_month];
             imageParameters.layerOption = esri.layers.ImageParameters.LAYER_OPTION_SHOW;
             imageParameters.transparent = true;
             imageParameters.format = "png32";
             var lyr = new esri.layers.ArcGISDynamicMapServiceLayer("https://service.ncddc.noaa.gov/arcgis/rest/services/Climatology/WorldOceanAtlas_WaterTemperature/MapServer", {"imageParameters":imageParameters});
             lyr.id = "Historical Water Temperatures - NODC";
             map.addLayer(lyr);
           }
           else  {
             dojo.byId("msgOcnWTmp").innerHTML = "Map service for historical water temperatures unavailable";
             dijit.byId('wtmp').setValue(false);
           }
         }
         queryID = queryID + 1;
       }
       // location of NERRs
       if (estuarine_reserves == "true")  {
         dojo.byId("msgNERRS").innerHTML = "";
         if (!results[queryID][0])  {
           dojo.byId("msgNERRS").innerHTML = "<center>Server error ... Try again later</center>";
           dijit.byId('estuarine_reserves').setValue(false);
         }
         else  {
           var featureCount = results[queryID][1].features;
           if (featureCount.length != 0)  {
             var imageParameters = new esri.layers.ImageParameters();
             imageParameters.format = "png32";
             var lyr = new esri.layers.ArcGISDynamicMapServiceLayer("https://service.ncddc.noaa.gov/arcgis/rest/services/EnvironmentalMonitoring/HABSOSViewBase/MapServer",{"imageParameters":imageParameters, "opacity":0.95});
             lyr.setVisibleLayers([1]);
             lyr.id = "Estuarine Reserves";
             map.addLayer(lyr);
           }
           else  {
             dojo.byId("msgNERRS").innerHTML = "Map service for estuarine reserves unavailable";
             dijit.byId('estuarine_reserves').setValue(false);
           }
         }
         queryID = queryID + 1;
       }
       // location of NMSPs
       if (marine_sanctuaries == "true")  {
         dojo.byId("msgNMSP").innerHTML = "";
         if (!results[queryID][0])  {
           dojo.byId("msgNMSP").innerHTML = "<center>Server error ... Try again later</center>";
           dijit.byId('marine_sanctuaries').setValue(false);
         }
         else  {
           var featureCount = results[queryID][1].features;
           if (featureCount.length != 0)  {
             var imageParameters = new esri.layers.ImageParameters();
             imageParameters.format = "png32";
             var lyr = new esri.layers.ArcGISDynamicMapServiceLayer("https://service.ncddc.noaa.gov/arcgis/rest/services/EnvironmentalMonitoring/HABSOSViewBase/MapServer",{"imageParameters":imageParameters, "opacity":0.95});
             lyr.setVisibleLayers([2]);
             lyr.id = "Marine Sanctuaries";
             map.addLayer(lyr);
           }
           else  {
             dojo.byId("msgNMSP").innerHTML = "Map service for marine sanctuaries unavailable";
             dijit.byId('marine_sanctuaries').setValue(false);
           }
         }
         queryID = queryID + 1;
       }
       // Shellfish areas
       if (shellfish_areas == "true")  {
         dojo.byId("msgOysters").innerHTML = "";
         if (!results[queryID][0])  {
           dojo.byId("msgOysters").innerHTML = "<center>Server error ... Try again later</center>";
           dijit.byId('shellfish_areas').setValue(false);
         }
         else  {
           var featureCount = results[queryID][1].features;
           if (featureCount.length != 0)  {
             var imageParameters = new esri.layers.ImageParameters();
             imageParameters.format = "png32";
             var lyr = new esri.layers.ArcGISDynamicMapServiceLayer("https://gis.ngdc.noaa.gov/arcgis/rest/services/GulfDataAtlas/Oysters_GOM/MapServer",{"imageParameters":imageParameters, "opacity":0.95});
             lyr.id = "Shellfish Areas";
             map.addLayer(lyr);  
           }
           else  {
             dojo.byId("msgOysters").innerHTML = "Map service for oysters unavailable";
             dijit.byId('shellfish_areas').setValue(false);
           }
         }
         queryID = queryID + 1;
       }

       // surface wind forecasts from NAM
       if (nam12Winds == "true")  {
         dojo.byId("msgMetModels_nam12winds").innerHTML = "";
         if (!results[queryID][0])  {
           dojo.byId("msgMetModels_nam12winds").innerHTML = "<center>Server error ... Try again later</center>";
           dijit.byId('nam12Winds').setValue(false);
         }
         else  {
           var featureCount = results[queryID][1].features;
           if (featureCount.length != 0)  {
             if (nam12Winds_forecast.indexOf("00 Hr Forecast") != -1)  forecast = 0;
             if (nam12Winds_forecast.indexOf("12 Hr Forecast") != -1)  forecast = 12;
             if (nam12Winds_forecast.indexOf("24 Hr Forecast") != -1)  forecast = 24;
             if (nam12Winds_forecast.indexOf("36 Hr Forecast") != -1)  forecast = 36;
             if (nam12Winds_forecast.indexOf("48 Hr Forecast") != -1)  forecast = 48;
             if (nam12Winds_forecast.indexOf("72 Hr Forecast") != -1)  forecast = 72;

             var today = new Date();

             if (today.getUTCHours() > 18)  {
               newDate = new Date(gmtMS);
               mth = newDate.getMonth();
               day = newDate.getDate();
               year = newDate.getFullYear();
               var month = mth + 1;
               var imageParameters = new esri.layers.ImageParameters();
               var layerDefs = [];
               if (forecast == 0)  {
                 var dateParameter = "vdate like '%";
                 dateParameter += year + ((month < 10) ? "0" : "") + month + ((day < 10) ? "0" : "") + day + " 12 Z + 00 hours";
                 dateParameter += "%'";
                 layerDefs[0] = dateParameter;
               }
               if (forecast == 12)  {
                 var dateParameter = "vdate like '%";
                 dateParameter += year + ((month < 10) ? "0" : "") + month + ((day < 10) ? "0" : "") + day + " 12 Z + 12 hours";
                 dateParameter += "%'";
                 layerDefs[1] = dateParameter;
               }
               if (forecast == 24)  {
                 var dateParameter = "vdate like '%";
                 dateParameter += year + ((month < 10) ? "0" : "") + month + ((day < 10) ? "0" : "") + day + " 12 Z + 24 hours";
                 dateParameter += "%'";
                 layerDefs[2] = dateParameter;
               }
               if (forecast == 36)  {
                 var dateParameter = "vdate like '%";
                 dateParameter += year + ((month < 10) ? "0" : "") + month + ((day < 10) ? "0" : "") + day + " 12 Z + 36 hours";
                 dateParameter += "%'";
                 layerDefs[3] = dateParameter;
               }
               if (forecast == 48)  {
                 var dateParameter = "vdate like '%";
                 dateParameter += year + ((month < 10) ? "0" : "") + month + ((day < 10) ? "0" : "") + day + " 12 Z + 48 hours";
                 dateParameter += "%'";
                 layerDefs[4] = dateParameter;
               }
               if (forecast == 72)  {
                 var dateParameter = "vdate like '%";
                 dateParameter += year + ((month < 10) ? "0" : "") + month + ((day < 10) ? "0" : "") + day + " 12 Z + 72 hours";
                 dateParameter += "%'";
                 layerDefs[5] = dateParameter;
               }
             }
             else  {
               newDate = new Date(gmtMS);
               mth = newDate.getMonth();
               day = newDate.getDate();
               year = newDate.getFullYear();
               var month = mth + 1;
               var imageParameters = new esri.layers.ImageParameters();
               var layerDefs = [];
               if (forecast == 0)  {
                 var dateParameter = "vdate like '%";
                 dateParameter += year + ((month < 10) ? "0" : "") + month + ((day < 10) ? "0" : "") + day + " 00 Z + 00 hours";
                 dateParameter += "%'";
                 layerDefs[0] = dateParameter;
               }
               if (forecast == 12)  {
                 var dateParameter = "vdate like '%";
                 dateParameter += year + ((month < 10) ? "0" : "") + month + ((day < 10) ? "0" : "") + day + " 00 Z + 12 hours";
                 dateParameter += "%'";
                 layerDefs[1] = dateParameter;
               }
               if (forecast == 24)  {
                 var dateParameter = "vdate like '%";
                 dateParameter += year + ((month < 10) ? "0" : "") + month + ((day < 10) ? "0" : "") + day + " 00 Z + 24 hours";
                 dateParameter += "%'";
                 layerDefs[2] = dateParameter;
               }
               if (forecast == 36)  {
                 var dateParameter = "vdate like '%";
                 dateParameter += year + ((month < 10) ? "0" : "") + month + ((day < 10) ? "0" : "") + day + " 00 Z + 36 hours";
                 dateParameter += "%'";
                 layerDefs[3] = dateParameter;
               }
               if (forecast == 48)  {
                 var dateParameter = "vdate like '%";
                 dateParameter += year + ((month < 10) ? "0" : "") + month + ((day < 10) ? "0" : "") + day + " 00 Z + 48 hours";
                 dateParameter += "%'";
                 layerDefs[4] = dateParameter;
               }
               if (forecast == 72)  {
                 var dateParameter = "vdate like '%";
                 dateParameter += year + ((month < 10) ? "0" : "") + month + ((day < 10) ? "0" : "") + day + " 00 Z + 72 hours";
                 dateParameter += "%'";
                 layerDefs[5] = dateParameter;
               }
             }
             imageParameters.layerDefinitions = layerDefs;
             if (forecast == 0)  imageParameters.layerIds = [0];
             if (forecast == 12)  imageParameters.layerIds = [1];
             if (forecast == 24)  imageParameters.layerIds = [2];
             if (forecast == 36)  imageParameters.layerIds = [3];
             if (forecast == 48)  imageParameters.layerIds = [4];
             if (forecast == 72)  imageParameters.layerIds = [5];
             imageParameters.layerOption = esri.layers.ImageParameters.LAYER_OPTION_SHOW;
             imageParameters.transparent = true;
             imageParameters.format = "png32";
             var lyr = new esri.layers.ArcGISDynamicMapServiceLayer("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/NAM12_SurfaceWindForecasts/MapServer", {"imageParameters":imageParameters,"opacity":0.95});
             lyr.id = "Surface Winds - NAM";
             map.addLayer(lyr);
           }
           else  {
             dojo.byId("msgMetModels_nam12winds").innerHTML = "No NAM12 winds for this date";
             dijit.byId('nam12Winds').setValue(false);
           }
         }
         queryID = queryID + 1;      
       }
       // sea surface currents from NRL (IASNFS model)
       if (ssc_forecast == "true")  {
         dojo.byId("msgOcnModels_ssc").innerHTML = "";
         if (!results[queryID][0])  {
           dojo.byId("msgOcnModels_ssc").innerHTML = "<center>Server error ... Try again later</center>";
           dijit.byId('ssc_forecast').setValue(false);
         }
         else  {
           var featureCount = results[queryID][1].features;
           if (featureCount.length != 0)  {
             if (ssc_timeframe.indexOf("Today") != -1)  timeframe = 0;
             if (ssc_timeframe.indexOf("24 Hr Forecast") != -1)  timeframe = 1;
             if (ssc_timeframe.indexOf("48 Hr Forecast") != -1)  timeframe = 2;
             if (ssc_timeframe.indexOf("1 Day Ago") != -1)  timeframe = -1;
             if (ssc_timeframe.indexOf("2 Days Ago") != -1)  timeframe = -2;
             if (ssc_timeframe.indexOf("3 Days Ago") != -1)  timeframe = -3;
             if (ssc_timeframe.indexOf("4 Days Ago") != -1)  timeframe = -4;
             if (ssc_timeframe.indexOf("5 Days Ago") != -1)  timeframe = -5;
             if (ssc_timeframe.indexOf("6 Days Ago") != -1)  timeframe = -6;
             if (ssc_timeframe.indexOf("7 Days Ago") != -1)  timeframe = -7;
             if (ssc_timeframe.indexOf("8 Days Ago") != -1)  timeframe = -8;
             if (ssc_timeframe.indexOf("9 Days Ago") != -1)  timeframe = -9;
             if (ssc_timeframe.indexOf("10 Days Ago") != -1)  timeframe = -10;
             if (ssc_timeframe.indexOf("11 Days Ago") != -1)  timeframe = -11;
             if (ssc_timeframe.indexOf("12 Days Ago") != -1)  timeframe = -12;
             if (ssc_timeframe.indexOf("13 Days Ago") != -1)  timeframe = -13;
             if (ssc_timeframe.indexOf("14 Days Ago") != -1)  timeframe = -14;
             if (ssc_timeframe.indexOf("15 Days Ago") != -1)  timeframe = -15;
             if (ssc_timeframe.indexOf("16 Days Ago") != -1)  timeframe = -16;
             if (ssc_timeframe.indexOf("17 Days Ago") != -1)  timeframe = -17;
             if (ssc_timeframe.indexOf("18 Days Ago") != -1)  timeframe = -18;
             if (ssc_timeframe.indexOf("19 Days Ago") != -1)  timeframe = -19;
             if (ssc_timeframe.indexOf("20 Days Ago") != -1)  timeframe = -20;
             if (ssc_timeframe.indexOf("21 Days Ago") != -1)  timeframe = -21;
             if (ssc_timeframe.indexOf("22 Days Ago") != -1)  timeframe = -22;
             if (ssc_timeframe.indexOf("23 Days Ago") != -1)  timeframe = -23;
             if (ssc_timeframe.indexOf("24 Days Ago") != -1)  timeframe = -24;
             if (ssc_timeframe.indexOf("25 Days Ago") != -1)  timeframe = -25;
             if (ssc_timeframe.indexOf("26 Days Ago") != -1)  timeframe = -26;
             if (ssc_timeframe.indexOf("27 Days Ago") != -1)  timeframe = -27;
             if (ssc_timeframe.indexOf("28 Days Ago") != -1)  timeframe = -28;
             if (ssc_timeframe.indexOf("29 Days Ago") != -1)  timeframe = -29;
             newDate = new Date(gmtMS + timeframe * 24 * 60 * 60 * 1000);
             mth = newDate.getMonth();
             day = newDate.getDate();
             year = newDate.getFullYear();
             var forecastDate = year + "-" + abbrMonthsArray[mth] + "-" + ((day < 10) ? "0" : "") + day;
             var imageParameters = new esri.layers.ImageParameters();
             imageParameters.format = "png32";
             if (timeframe >= 0)  {
               mth = today.getMonth();
               day = today.getDate();
               year = today.getFullYear();
               month = mth + 1;
               var dateParameter = "date_='";
               dateParameter += year + "/" + ((month < 10) ? "0" : "") + month + "/" + ((day < 10) ? "0" : "") + day;
               dateParameter += "' AND time='";
               if (timeframe == 0)  dateParameter += "00hr'";
               if (timeframe == 1)  dateParameter += "24hr'";
               if (timeframe == 2)  dateParameter += "48hr'";
               var layerDefs = [];
               layerDefs[timeframe] = dateParameter;
               imageParameters.layerDefinitions = layerDefs;
               imageParameters.layerIds = [timeframe];
               imageParameters.layerOption = esri.layers.ImageParameters.LAYER_OPTION_SHOW;
               imageParameters.transparent = true;
               var lyr = new esri.layers.ArcGISDynamicMapServiceLayer("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/IASNFS_SurfaceCurrentForecasts/MapServer", {"imageParameters":imageParameters,"opacity":0.95});
               lyr.id = "Surface Currents - AMSEAS";
             }
             else  {
               timeframe = (timeframe * -1) - 1;
               month = mth + 1;
               var dateParameter = "date_='";
               dateParameter += year + ((month < 10) ? "0" : "") + month + ((day < 10) ? "0" : "") + day;
               dateParameter += "'"; 
               var layerDefs = [];
               layerDefs[timeframe] = dateParameter;
               imageParameters.layerDefinitions = layerDefs;
               imageParameters.layerIds = [timeframe];
               imageParameters.layerOption = esri.layers.ImageParameters.LAYER_OPTION_SHOW;
               imageParameters.transparent = true;
               var lyr = new esri.layers.ArcGISDynamicMapServiceLayer("https://service.ncddc.noaa.gov/arcgis/rest/services/Models/AMSEAS_SurfaceCurrent_Hindcasts/MapServer", {"imageParameters":imageParameters,"opacity":0.95});
               lyr.id = "Surface Currents - AMSEAS";
             }
             map.addLayer(lyr);
           }
           else  {
             if (timeframe >= 0) {
               dojo.byId("msgOcnModels_ssc").innerHTML = "Forecast of surface currents not available yet .. Try later";
             }
             else {
               dojo.byId("msgOcnModels_ssc").innerHTML = "No surface current data for this date";
             }
             dijit.byId('ssc_forecast').setValue(false);
           }
         }
         queryID = queryID + 1;            
       }
       // NDBC buoys
       if (buoys == "true")  {
         dojo.byId("msgBuoys").innerHTML = "";
         if (!results[queryID][0])  {
           dojo.byId("msgBuoys").innerHTML = "<center>Server error ... Try again later</center>";
           dijit.byId('buoys').setValue(false);
         }
         else  {
           var featureCount = results[queryID][1].features;
           if (featureCount.length != 0)  {
             var imageParameters = new esri.layers.ImageParameters();
             imageParameters.format = "png32";
             var lyr = new esri.layers.ArcGISDynamicMapServiceLayer("https://service.ncddc.noaa.gov/arcgis/rest/services/NMSP/FGB/MapServer",{"imageParameters":imageParameters,"opacity":0.95});
             lyr.setVisibleLayers([2]);
             lyr.id = "Buoys - NDBC";
             map.addLayer(lyr);
           }
           else  {
             dojo.byId("msgBuoys").innerHTML = "Map service for buoys unavailable";
             dijit.byId('buoys').setValue(false);
           }
         }
         queryID = queryID + 1;
       }
       // winds from NDBC buoys
       if (windsBuoys == "true")  {
         dojo.byId("msgMet_NDBCWinds").innerHTML = "";
         if (!results[queryID][0])  {
           dojo.byId("msgMet_NDBCWinds").innerHTML = "<center>Server error ... Try again later</center>";
           dijit.byId('windsBuoys').setValue(false);
         }
         else  {
           var featureCount = results[queryID][1].features;
           if (featureCount.length != 0)  {
             var imageParameters = new esri.layers.ImageParameters();
             imageParameters.format = "png32";
             var lyr = new esri.layers.ArcGISDynamicMapServiceLayer("https://service.ncddc.noaa.gov/arcgis/rest/services/InSituStations/InSituStationObservations/MapServer",{"imageParameters":imageParameters});
             lyr.setVisibleLayers([0]);
             lyr.id = "Winds from NDBC Buoys";
             map.addLayer(lyr);
           }
           else  {
             dojo.byId("msgMet_NDBCWinds").innerHTML = "Map service for winds from buoys unavailable";
             dijit.byId('windsBuoys').setValue(false);
           }
         }
         queryID = queryID + 1;
       }
       // surface currents from TABS buoys - current timeframe only
       if (tabsBuoys == "true")  {
         dojo.byId("msgOcn_TABS").innerHTML = "";
         if (!results[queryID][0])  {
           dojo.byId("msgOcn_TABS").innerHTML = "<center>Server error ... Try again later</center>";
           dijit.byId('tabsBuoys').setValue(false);
         }
         else  {
           var featureCount = results[queryID][1].features;
           if (featureCount.length != 0)  {
             var imageParameters = new esri.layers.ImageParameters();
             imageParameters.format = "png32";
             var lyr = new esri.layers.ArcGISDynamicMapServiceLayer("https://service.ncddc.noaa.gov/arcgis/rest/services/InSituStations/InSituStationObservations/MapServer",{"imageParameters":imageParameters});
             lyr.setVisibleLayers([1]);
             lyr.id = "Surface Currents from TABS";
             map.addLayer(lyr);
           }
           else  {
             dojo.byId("msgOcn_TABS").innerHTML = "Map service for currents from TABS unavailable";
             dijit.byId('tabsBuoys').setValue(false);
           }
         }
         queryID = queryID + 1;
       }
       // surface currents from PORTS buoys - current timeframe only
       if (portsBuoys == "true")  {
         dojo.byId("msgOcn_PORTS").innerHTML = "";
         if (!results[queryID][0])  {
           dojo.byId("msgOcn_PORTS").innerHTML = "<center>Server error ... Try again later</center>";
           dijit.byId('portsBuoys').setValue(false);
         }
         else  {
           var featureCount = results[queryID][1].features;
           if (featureCount.length != 0)  {
             var imageParameters = new esri.layers.ImageParameters();
             imageParameters.format = "png32";
             var lyr = new esri.layers.ArcGISDynamicMapServiceLayer("https://service.ncddc.noaa.gov/arcgis/rest/services/InSituStations/InSituStationObservations/MapServer",{"imageParameters":imageParameters});
             lyr.setVisibleLayers([2]);
             lyr.id = "Surface Currents from PORTS";
             map.addLayer(lyr);
           }
           else  {
             dojo.byId("msgOcn_PORTS").innerHTML = "Map service for currents from PORTS unavailable";
             dijit.byId('portsBuoys').setValue(false);
           }
         }
         queryID = queryID + 1;
       }
       // METAR stations
       if (metar == "true")  {
         dojo.byId("msgMETAR").innerHTML = "";
         if (!results[queryID][0])  {
           dojo.byId("msgMETAR").innerHTML = "<center>Server error ... Try again later</center>";
           dijit.byId('metar').setValue(false);
         }
         else  {
           var featureCount = results[queryID][1].features;
           if (featureCount.length != 0)  {
             var imageParameters = new esri.layers.ImageParameters();
             imageParameters.format = "png32";
             var lyr = new esri.layers.ArcGISDynamicMapServiceLayer("https://service.ncddc.noaa.gov/arcgis/rest/services/InSituStations/InSituStationObservations/MapServer",{"imageParameters":imageParameters});
             lyr.setVisibleLayers([4]);
             lyr.id = "METAR Stations";
             map.addLayer(lyr);
           }
           else  {
             dojo.byId("msgMETAR").innerHTML = "Map service for METAR stations unavailable";
             dijit.byId('metar').setValue(false);
           }
         }
         queryID = queryID + 1;
       }
       // river gages from USGS
       if (usgsGages == "true")  {
         dojo.byId("msgGages").innerHTML = "";
         if (!results[queryID][0])  {
           dojo.byId("msgGages").innerHTML = "<center>Server error ... Try again later</center>";
           dijit.byId('usgsGages').setValue(false);
         }
         else  {
           var featureCount = results[queryID][1].features;
           if (featureCount.length != 0)  {
             var imageParameters = new esri.layers.ImageParameters();
             imageParameters.format = "png32";
             var lyr = new esri.layers.ArcGISDynamicMapServiceLayer("https://service.ncddc.noaa.gov/arcgis/rest/services/InSituStations/InSituStationObservations/MapServer",{"imageParameters":imageParameters});
             lyr.setVisibleLayers([3]);
             lyr.id = "USGS River Gages";
             map.addLayer(lyr);
           }
           else  {
             dojo.byId("msgGages").innerHTML = "Map service for currents from PORTS unavailable";
             dijit.byId('usgsGages').setValue(false);
           }
         }
         queryID = queryID + 1;
       }
       // generate a list of map layers for a separate floating window pane
       createMapLayerList();
     } 

     function createMapLayerList()  {
       //alert(map.layerIds.length);

       var mapLayerList = "";
       if (map.layerIds.length == 1)  {
         mapLayerList += 'You currently have no additional layers drawn on the map.';
         mapLayerList += '<p/>';
         mapLayerList += 'As you add layers to the map, they will be listed in this panel.';
         mapLayerList += '<p/>';
         mapLayerList += 'You may use this panel to remove any layers added to the map. You can also go back to the "Add Layers" tab to remove layers.';
       }
       else  {
         mapLayerList += '<table colspan ="3">';
         mapLayerList += '<tr><td></td><td></td><td align="center">Opacity Setting</td></tr>';
         for (var j=map.layerIds.length-1;j>0;j--)  {
           var sliderID = "Slider"+j;
           var layerID = j;
           var currentLayer = map.getLayer(map.layerIds[j]);
           if (currentLayer.id == "Chlorophyll - NOAA")  {
             layerID = j;
             var sliderID = "LyrSlider" + layerID; 
             mapLayerList += '<tr><td width="5"><input type="checkbox" id="lyr_NOAA_Chlorophyll" name="lyr_NOAA_Chlorophyll" value="true" checked onClick="removeFromMapLayerList()"></td><td>Chlorophyll Composite</td>'; 
             mapLayerList += '<td><a title="decrease opacity" href="javascript:changeLayerOpacity(-5,'+layerID+');"><img src="images/decOpacity.png" height="12" width="12"></a>';
             mapLayerList += '&nbsp;&nbsp;<input id="'+sliderID+'" type="text" value="95" readonly="readonly" style="width:25px;height:10px;text-align:center;background-color:#ffffff;"/>';
             mapLayerList += '&nbsp;&nbsp;<a title="increase opacity" href="javascript:changeLayerOpacity(5,'+layerID+');"><img src="images/incOpacity.png" height="12" width="12"></a></td></tr>';
           }
           if (currentLayer.id == "Chlorophyll Anomaly - NOAA")  {
             layerID = j;
             var sliderID = "LyrSlider" + layerID; 
             mapLayerList += '<tr><td width="5"><input type="checkbox" id="lyr_NOAA_ChlorophyllAnomaly" name="lyr_NOAA_ChlorophyllAnomaly" value="true" checked onClick="removeFromMapLayerList()"></td><td>Chlorophyll Anomaly</td>'; 
             mapLayerList += '<td><a title="decrease opacity" href="javascript:changeLayerOpacity(-5,'+layerID+');"><img src="images/decOpacity.png" height="12" width="12"></a>';
             mapLayerList += '&nbsp;&nbsp;<input id="'+sliderID+'" type="text" value="95" readonly="readonly" style="width:25px;height:10px;text-align:center;background-color:#ffffff;"/>';
             mapLayerList += '&nbsp;&nbsp;<a title="increase opacity" href="javascript:changeLayerOpacity(5,'+layerID+');"><img src="images/incOpacity.png" height="12" width="12"></a></td></tr>';
           }
           if (currentLayer.id == "Monthly Chlorophyll Climatology - USF")  {
             layerID = j;
             var sliderID = "LyrSlider" + layerID; 
             mapLayerList += '<tr><td width="5"><input type="checkbox" id="lyr_USF_Chl_Climo" name="lyr_USF_Chl_Climo" value="true" checked onClick="removeFromMapLayerList()"></td><td>Monthly Chlorophyll Climatology</td>'; 
             mapLayerList += '<td><a title="decrease opacity" href="javascript:changeLayerOpacity(-5,'+layerID+');"><img src="images/decOpacity.png" height="12" width="12"></a>';
             mapLayerList += '&nbsp;&nbsp;<input id="'+sliderID+'" type="text" value="95" readonly="readonly" style="width:25px;height:10px;text-align:center;background-color:#ffffff;"/>';
             mapLayerList += '&nbsp;&nbsp;<a title="increase opacity" href="javascript:changeLayerOpacity(5,'+layerID+');"><img src="images/incOpacity.png" height="12" width="12"></a></td></tr>';

           }
           if (currentLayer.id == "Enhanced True Color (RGB) - USF")  {
             layerID = j;
             var sliderID = "LyrSlider" + layerID; 
             mapLayerList += '<tr><td width="5"><input type="checkbox" id="lyr_USF_RGB" name="lyr_USF_RGB" value="true" checked onClick="removeFromMapLayerList()"></td><td>Enhanced True Color</td>'; 
             mapLayerList += '<td><a title="decrease opacity" href="javascript:changeLayerOpacity(-5,'+layerID+');"><img src="images/decOpacity.png" height="12" width="12"></a>';
             mapLayerList += '&nbsp;&nbsp;<input id="'+sliderID+'" type="text" value="95" readonly="readonly" style="width:25px;height:10px;text-align:center;background-color:#ffffff;"/>';
             mapLayerList += '&nbsp;&nbsp;<a title="increase opacity" href="javascript:changeLayerOpacity(5,'+layerID+');"><img src="images/incOpacity.png" height="12" width="12"></a></td></tr>';
           }
           if (currentLayer.id == "Normalized Fluorescence Line Height - USF")  {
             layerID = j;
             var sliderID = "LyrSlider" + layerID; 
             mapLayerList += '<tr><td width="5"><input type="checkbox" id="lyr_USF_NFLH" name="lyr_USF_NFLH" value="true" checked onClick="removeFromMapLayerList()"></td><td>Normalized Fluoresence Line Height</td>'; 
             mapLayerList += '<td><a title="decrease opacity" href="javascript:changeLayerOpacity(-5,'+layerID+');"><img src="images/decOpacity.png" height="12" width="12"></a>';
             mapLayerList += '&nbsp;&nbsp;<input id="'+sliderID+'" type="text" value="95" readonly="readonly" style="width:25px;height:10px;text-align:center;background-color:#ffffff;"/>';
             mapLayerList += '&nbsp;&nbsp;<a title="increase opacity" href="javascript:changeLayerOpacity(5,'+layerID+');"><img src="images/incOpacity.png" height="12" width="12"></a></td></tr>';
           }
           if (currentLayer.id == "Sea Surface Temperatures - USF")  {
             layerID = j;
             var sliderID = "LyrSlider" + layerID; 
             mapLayerList += '<tr><td width="5"><input type="checkbox" id="lyr_USF_SST" name="lyr_USF_SST" value="true" checked onClick="removeFromMapLayerList()"></td><td>Sea Surface Temperatures - USF</td>'; 
             mapLayerList += '<td><a title="decrease opacity" href="javascript:changeLayerOpacity(-5,'+layerID+');"><img src="images/decOpacity.png" height="12" width="12"></a>';
             mapLayerList += '&nbsp;&nbsp;<input id="'+sliderID+'" type="text" value="95" readonly="readonly" style="width:25px;height:10px;text-align:center;background-color:#ffffff;"/>';
             mapLayerList += '&nbsp;&nbsp;<a title="increase opacity" href="javascript:changeLayerOpacity(5,'+layerID+');"><img src="images/incOpacity.png" height="12" width="12"></a></td></tr>';
           }
           if (currentLayer.id == "Weather Radar")  {
             layerID = j;
             var sliderID = "LyrSlider" + layerID; 
             mapLayerList += '<tr><td width="5"><input type="checkbox" id="lyr_NWS_Radar" name="lyr_NWS_Radar" value="true" checked onClick="removeFromMapLayerList()"></td><td>Weather Radar</td>'; 
             mapLayerList += '<td><a title="decrease opacity" href="javascript:changeLayerOpacity(-5,'+layerID+');"><img src="images/decOpacity.png" height="12" width="12"></a>';
             mapLayerList += '&nbsp;&nbsp;<input id="'+sliderID+'" type="text" value="95" readonly="readonly" style="width:25px;height:10px;text-align:center;background-color:#ffffff;"/>';
             mapLayerList += '&nbsp;&nbsp;<a title="increase opacity" href="javascript:changeLayerOpacity(5,'+layerID+');"><img src="images/incOpacity.png" height="12" width="12"></a></td></tr>';
           }
           if (currentLayer.id == "Air Temperatures - NWS")  {
             layerID = j;
             var sliderID = "LyrSlider" + layerID; 
             mapLayerList += '<tr><td width="5"><input type="checkbox" id="lyr_NWS_AirTemp" name="lyr_NWS_AirTemp" value="true" checked onClick="removeFromMapLayerList()"></td><td>Air Temperatures - Forecasts</td>'; 
             mapLayerList += '<td><a title="decrease opacity" href="javascript:changeLayerOpacity(-5,'+layerID+');"><img src="images/decOpacity.png" height="12" width="12"></a>';
             mapLayerList += '&nbsp;&nbsp;<input id="'+sliderID+'" type="text" value="95" readonly="readonly" style="width:25px;height:10px;text-align:center;background-color:#ffffff;"/>';
             mapLayerList += '&nbsp;&nbsp;<a title="increase opacity" href="javascript:changeLayerOpacity(5,'+layerID+');"><img src="images/incOpacity.png" height="12" width="12"></a></td></tr>';
           }
           if (currentLayer.id == "Probability of Precipitation - NWS")  {
             layerID = j;
             var sliderID = "LyrSlider" + layerID; 
             mapLayerList += '<tr><td width="5"><input type="checkbox" id="lyr_NWS_POP12" name="lyr_NWS_POP12" value="true" checked onClick="removeFromMapLayerList()"></td><td>Precipitation Probability - Forecasts</td>'; 
             mapLayerList += '<td><a title="decrease opacity" href="javascript:changeLayerOpacity(-5,'+layerID+');"><img src="images/decOpacity.png" height="12" width="12"></a>';
             mapLayerList += '&nbsp;&nbsp;<input id="'+sliderID+'" type="text" value="95" readonly="readonly" style="width:25px;height:10px;text-align:center;background-color:#ffffff;"/>';
             mapLayerList += '&nbsp;&nbsp;<a title="increase opacity" href="javascript:changeLayerOpacity(5,'+layerID+');"><img src="images/incOpacity.png" height="12" width="12"></a></td></tr>';
           }
           if (currentLayer.id == "Precipitation Amounts - NWS")  {
             layerID = j;
             var sliderID = "LyrSlider" + layerID; 
             mapLayerList += '<tr><td width="5"><input type="checkbox" id="lyr_NWS_QPF" name="lyr_NWS_QPF" value="true" checked onClick="removeFromMapLayerList()"></td><td>Precipitation Amounts - Forecasts</td>'; 
             mapLayerList += '<td><a title="decrease opacity" href="javascript:changeLayerOpacity(-5,'+layerID+');"><img src="images/decOpacity.png" height="12" width="12"></a>';
             mapLayerList += '&nbsp;&nbsp;<input id="'+sliderID+'" type="text" value="95" readonly="readonly" style="width:25px;height:10px;text-align:center;background-color:#ffffff;"/>';
             mapLayerList += '&nbsp;&nbsp;<a title="increase opacity" href="javascript:changeLayerOpacity(5,'+layerID+');"><img src="images/incOpacity.png" height="12" width="12"></a></td></tr>';
           }
           if (currentLayer.id == "Sea Surface Heights - AMSEAS")  {
             layerID = j;
             var sliderID = "LyrSlider" + layerID; 
             mapLayerList += '<tr><td width="5"><input type="checkbox" id="lyr_AMSEAS_SSH" name="lyr_AMSEAS_SSH" value="true" checked onClick="removeFromMapLayerList()"></td><td>Modelled Sea Surface Heights</td>'; 
             mapLayerList += '<td><a title="decrease opacity" href="javascript:changeLayerOpacity(-5,'+layerID+');"><img src="images/decOpacity.png" height="12" width="12"></a>';
             mapLayerList += '&nbsp;&nbsp;<input id="'+sliderID+'" type="text" value="95" readonly="readonly" style="width:25px;height:10px;text-align:center;background-color:#ffffff;"/>';
             mapLayerList += '&nbsp;&nbsp;<a title="increase opacity" href="javascript:changeLayerOpacity(5,'+layerID+');"><img src="images/incOpacity.png" height="12" width="12"></a></td></tr>';
           }
           if (currentLayer.id == "Sea Surface Salinities - AMSEAS")  {
             layerID = j;
             var sliderID = "LyrSlider" + layerID; 
             mapLayerList += '<tr><td width="5"><input type="checkbox" id="lyr_AMSEAS_SSS" name="lyr_AMSEAS_SSS" value="true" checked onClick="removeFromMapLayerList()"></td><td>Modelled Sea Surface Salinities</td>'; 
             mapLayerList += '<td><a title="decrease opacity" href="javascript:changeLayerOpacity(-5,'+layerID+');"><img src="images/decOpacity.png" height="12" width="12"></a>';
             mapLayerList += '&nbsp;&nbsp;<input id="'+sliderID+'" type="text" value="95" readonly="readonly" style="width:25px;height:10px;text-align:center;background-color:#ffffff;"/>';
             mapLayerList += '&nbsp;&nbsp;<a title="increase opacity" href="javascript:changeLayerOpacity(5,'+layerID+');"><img src="images/incOpacity.png" height="12" width="12"></a></td></tr>';
           }
           if (currentLayer.id == "Water Temperatures - AMSEAS")  {
             layerID = j;
             var sliderID = "LyrSlider" + layerID; 
             mapLayerList += '<tr><td width="5"><input type="checkbox" id="lyr_AMSEAS_SST" name="lyr_AMSEAS_SST" value="true" checked onClick="removeFromMapLayerList()"></td><td>Modelled Water Temperatures</td>'; 
             mapLayerList += '<td><a title="decrease opacity" href="javascript:changeLayerOpacity(-5,'+layerID+');"><img src="images/decOpacity.png" height="12" width="12"></a>';
             mapLayerList += '&nbsp;&nbsp;<input id="'+sliderID+'" type="text" value="95" readonly="readonly" style="width:25px;height:10px;text-align:center;background-color:#ffffff;"/>';
             mapLayerList += '&nbsp;&nbsp;<a title="increase opacity" href="javascript:changeLayerOpacity(5,'+layerID+');"><img src="images/incOpacity.png" height="12" width="12"></a></td></tr>';
           }
           //if (currentLayer.id == "Respiratory Irritation Forecast")  {
           //  layerID = j;
           //  var sliderID = "LyrSlider" + layerID; 
           //  mapLayerList += '<tr><td width="5"><input type="checkbox" id="lyr_RI_Forecast" name="lyr_RI_Forecast" value="true" checked onClick="removeFromMapLayerList()"></td><td>Respiratory Irritation Forecast</td>'; 
           //  mapLayerList += '<td><a title="decrease opacity" href="javascript:changeLayerOpacity(-5,'+layerID+');"><img src="images/decOpacity.png" height="12" width="12"></a>';
           //  mapLayerList += '&nbsp;&nbsp;<input id="'+sliderID+'" type="text" value="95" readonly="readonly" style="width:25px;height:10px;text-align:center;background-color:#ffffff;"/>';
           //  mapLayerList += '&nbsp;&nbsp;<a title="increase opacity" href="javascript:changeLayerOpacity(5,'+layerID+');"><img src="images/incOpacity.png" height="12" width="12"></a></td></tr>';
           //}
           if (currentLayer.id == "Graticule")  {
             layerID = j;
             var sliderID = "LyrSlider" + layerID; 
             mapLayerList += '<tr><td width="5"><input type="checkbox" id="lyr_latlongrid" name="lyr_latlongrid" value="true" checked onClick="removeFromMapLayerList()"></td><td>Graticule</td>'; 
             mapLayerList += '<td><a title="decrease opacity" href="javascript:changeLayerOpacity(-5,'+layerID+');"><img src="images/decOpacity.png" height="12" width="12"></a>';
             mapLayerList += '&nbsp;&nbsp;<input id="'+sliderID+'" type="text" value="95" readonly="readonly" style="width:25px;height:10px;text-align:center;background-color:#ffffff;"/>';
             mapLayerList += '&nbsp;&nbsp;<a title="increase opacity" href="javascript:changeLayerOpacity(5,'+layerID+');"><img src="images/incOpacity.png" height="12" width="12"></a></td></tr>';
           }
           if (currentLayer.id == "Bathymetry")  {
             layerID = j;
             var sliderID = "LyrSlider" + layerID; 
             mapLayerList += '<tr><td width="5"><input type="checkbox" id="lyr_bathy" name="lyr_bathy" value="true" checked onClick="removeFromMapLayerList()"></td><td>Bathymetry</td>'; 
             mapLayerList += '<td><a title="decrease opacity" href="javascript:changeLayerOpacity(-5,'+layerID+');"><img src="images/decOpacity.png" height="12" width="12"></a>';
             mapLayerList += '&nbsp;&nbsp;<input id="'+sliderID+'" type="text" value="95" readonly="readonly" style="width:25px;height:10px;text-align:center;background-color:#ffffff;"/>';
             mapLayerList += '&nbsp;&nbsp;<a title="increase opacity" href="javascript:changeLayerOpacity(5,'+layerID+');"><img src="images/incOpacity.png" height="12" width="12"></a></td></tr>';
           }
           if (currentLayer.id == "Historical Water Temperatures - NODC")  {
             layerID = j;
             var sliderID = "LyrSlider" + layerID; 
             mapLayerList += '<tr><td width="5"><input type="checkbox" id="lyr_WOA_wtmp" name="lyr_WOA_wtmp" value="true" checked onClick="removeFromMapLayerList()"></td><td>Historical Water Temperatures</td>'; 
             mapLayerList += '<td><a title="decrease opacity" href="javascript:changeLayerOpacity(-5,'+layerID+');"><img src="images/decOpacity.png" height="12" width="12"></a>';
             mapLayerList += '&nbsp;&nbsp;<input id="'+sliderID+'" type="text" value="95" readonly="readonly" style="width:25px;height:10px;text-align:center;background-color:#ffffff;"/>';
             mapLayerList += '&nbsp;&nbsp;<a title="increase opacity" href="javascript:changeLayerOpacity(5,'+layerID+');"><img src="images/incOpacity.png" height="12" width="12"></a></td></tr>';
           }
           if (currentLayer.id == "Estuarine Reserves")  {
             layerID = j;
             var sliderID = "LyrSlider" + layerID; 
             mapLayerList += '<tr><td width="5"><input type="checkbox" id="lyr_NERRS" name="lyr_NERRS" value="true" checked onClick="removeFromMapLayerList()"></td><td>Estuarine Reserves</td>'; 
             mapLayerList += '<td><a title="decrease opacity" href="javascript:changeLayerOpacity(-5,'+layerID+');"><img src="images/decOpacity.png" height="12" width="12"></a>';
             mapLayerList += '&nbsp;&nbsp;<input id="'+sliderID+'" type="text" value="95" readonly="readonly" style="width:25px;height:10px;text-align:center;background-color:#ffffff;"/>';
             mapLayerList += '&nbsp;&nbsp;<a title="increase opacity" href="javascript:changeLayerOpacity(5,'+layerID+');"><img src="images/incOpacity.png" height="12" width="12"></a></td></tr>';
           }
           if (currentLayer.id == "Marine Sanctuaries")  {
             layerID = j;
             var sliderID = "LyrSlider" + layerID; 
             mapLayerList += '<tr><td width="5"><input type="checkbox" id="lyr_NMSP" name="lyr_NMSP" value="true" checked onClick="removeFromMapLayerList()"></td><td>Marine Sanctuaries</td>'; 
             mapLayerList += '<td><a title="decrease opacity" href="javascript:changeLayerOpacity(-5,'+layerID+');"><img src="images/decOpacity.png" height="12" width="12"></a>';
             mapLayerList += '&nbsp;&nbsp;<input id="'+sliderID+'" type="text" value="95" readonly="readonly" style="width:25px;height:10px;text-align:center;background-color:#ffffff;"/>';
             mapLayerList += '&nbsp;&nbsp;<a title="increase opacity" href="javascript:changeLayerOpacity(5,'+layerID+');"><img src="images/incOpacity.png" height="12" width="12"></a></td></tr>';
           }
           if (currentLayer.id == "Shellfish Areas")  {
             layerID = j;
             var sliderID = "LyrSlider" + layerID; 
             mapLayerList += '<tr><td width="5"><input type="checkbox" id="lyr_Oysters" name="lyr_Oysters" value="true" checked onClick="removeFromMapLayerList()"></td><td>Eastern Oyster Beds</td>'; 
             mapLayerList += '<td><a title="decrease opacity" href="javascript:changeLayerOpacity(-5,'+layerID+');"><img src="images/decOpacity.png" height="12" width="12"></a>';
             mapLayerList += '&nbsp;&nbsp;<input id="'+sliderID+'" type="text" value="95" readonly="readonly" style="width:25px;height:10px;text-align:center;background-color:#ffffff;"/>';
             mapLayerList += '&nbsp;&nbsp;<a title="increase opacity" href="javascript:changeLayerOpacity(5,'+layerID+');"><img src="images/incOpacity.png" height="12" width="12"></a></td></tr>';
           }
           if (currentLayer.id == "Surface Winds - NAM")  {
             layerID = j;
             var sliderID = "LyrSlider" + layerID; 
             mapLayerList += '<tr><td width="5"><input type="checkbox" id="lyr_NAMWinds" name="lyr_NAMWinds" value="true" checked onClick="removeFromMapLayerList()"></td><td>Modelled Surface Winds</td>'; 
             mapLayerList += '<td><a title="decrease opacity" href="javascript:changeLayerOpacity(-5,'+layerID+');"><img src="images/decOpacity.png" height="12" width="12"></a>';
             mapLayerList += '&nbsp;&nbsp;<input id="'+sliderID+'" type="text" value="95" readonly="readonly" style="width:25px;height:10px;text-align:center;background-color:#ffffff;"/>';
             mapLayerList += '&nbsp;&nbsp;<a title="increase opacity" href="javascript:changeLayerOpacity(5,'+layerID+');"><img src="images/incOpacity.png" height="12" width="12"></a></td></tr>';
           }
           if (currentLayer.id == "Surface Currents - AMSEAS")  {
             layerID = j;
             var sliderID = "LyrSlider" + layerID; 
             mapLayerList += '<tr><td width="5"><input type="checkbox" id="lyr_AMSEAS_SSC" name="lyr_AMSEAS_SSC" value="true" checked onClick="removeFromMapLayerList()"></td><td>Modelled Sea Surface Currents</td>'; 
             mapLayerList += '<td><a title="decrease opacity" href="javascript:changeLayerOpacity(-5,'+layerID+');"><img src="images/decOpacity.png" height="12" width="12"></a>';
             mapLayerList += '&nbsp;&nbsp;<input id="'+sliderID+'" type="text" value="95" readonly="readonly" style="width:25px;height:10px;text-align:center;background-color:#ffffff;"/>';
             mapLayerList += '&nbsp;&nbsp;<a title="increase opacity" href="javascript:changeLayerOpacity(5,'+layerID+');"><img src="images/incOpacity.png" height="12" width="12"></a></td></tr>';
           }
           if (currentLayer.id == "Buoys - NDBC")  {
             layerID = j;
             var sliderID = "LyrSlider" + layerID; 
             mapLayerList += '<tr><td width="5"><input type="checkbox" id="lyr_NDBC_buoys" name="lyr_NDBC_buoys" value="true" checked onClick="removeFromMapLayerList()"></td><td>Buoys - NDBC</td>'; 
             mapLayerList += '<td><a title="decrease opacity" href="javascript:changeLayerOpacity(-5,'+layerID+');"><img src="images/decOpacity.png" height="12" width="12"></a>';
             mapLayerList += '&nbsp;&nbsp;<input id="'+sliderID+'" type="text" value="95" readonly="readonly" style="width:25px;height:10px;text-align:center;background-color:#ffffff;"/>';
             mapLayerList += '&nbsp;&nbsp;<a title="increase opacity" href="javascript:changeLayerOpacity(5,'+layerID+');"><img src="images/incOpacity.png" height="12" width="12"></a></td></tr>';
           }
           if (currentLayer.id == "Winds from NDBC Buoys")  {
             layerID = j;
             var sliderID = "LyrSlider" + layerID; 
             mapLayerList += '<tr><td width="5"><input type="checkbox" id="lyr_NDBC_winds" name="lyr_NDBC_winds" value="true" checked onClick="removeFromMapLayerList()"></td><td>Winds - NDBC Buoys</td>'; 
             mapLayerList += '<td><a title="decrease opacity" href="javascript:changeLayerOpacity(-5,'+layerID+');"><img src="images/decOpacity.png" height="12" width="12"></a>';
             mapLayerList += '&nbsp;&nbsp;<input id="'+sliderID+'" type="text" value="95" readonly="readonly" style="width:25px;height:10px;text-align:center;background-color:#ffffff;"/>';
             mapLayerList += '&nbsp;&nbsp;<a title="increase opacity" href="javascript:changeLayerOpacity(5,'+layerID+');"><img src="images/incOpacity.png" height="12" width="12"></a></td></tr>';
           }
           if (currentLayer.id == "Surface Currents from TABS")  {
             layerID = j;
             var sliderID = "LyrSlider" + layerID; 
             mapLayerList += '<tr><td width="5"><input type="checkbox" id="lyr_TABS_currents" name="lyr_TABS_currents" value="true" checked onClick="removeFromMapLayerList()"></td><td>Surface Currents - TABS</td>'; 
             mapLayerList += '<td><a title="decrease opacity" href="javascript:changeLayerOpacity(-5,'+layerID+');"><img src="images/decOpacity.png" height="12" width="12"></a>';
             mapLayerList += '&nbsp;&nbsp;<input id="'+sliderID+'" type="text" value="95" readonly="readonly" style="width:25px;height:10px;text-align:center;background-color:#ffffff;"/>';
             mapLayerList += '&nbsp;&nbsp;<a title="increase opacity" href="javascript:changeLayerOpacity(5,'+layerID+');"><img src="images/incOpacity.png" height="12" width="12"></a></td></tr>';
           }
           if (currentLayer.id == "Surface Currents from PORTS")  {
             layerID = j;
             var sliderID = "LyrSlider" + layerID; 
             mapLayerList += '<tr><td width="5"><input type="checkbox" id="lyr_PORTS_currents" name="lyr_PORTS_currents" value="true" checked onClick="removeFromMapLayerList()"></td><td>Surface Currents - PORTS</td>'; 
             mapLayerList += '<td><a title="decrease opacity" href="javascript:changeLayerOpacity(-5,'+layerID+');"><img src="images/decOpacity.png" height="12" width="12"></a>';
             mapLayerList += '&nbsp;&nbsp;<input id="'+sliderID+'" type="text" value="95" readonly="readonly" style="width:25px;height:10px;text-align:center;background-color:#ffffff;"/>';
             mapLayerList += '&nbsp;&nbsp;<a title="increase opacity" href="javascript:changeLayerOpacity(5,'+layerID+');"><img src="images/incOpacity.png" height="12" width="12"></a></td></tr>';
           }
           if (currentLayer.id == "METAR Stations")  {
             layerID = j;
             var sliderID = "LyrSlider" + layerID; 
             mapLayerList += '<tr><td width="5"><input type="checkbox" id="lyr_METAR" name="lyr_METAR" value="true" checked onClick="removeFromMapLayerList()"></td><td>METAR Stations</td>'; 
             mapLayerList += '<td><a title="decrease opacity" href="javascript:changeLayerOpacity(-5,'+layerID+');"><img src="images/decOpacity.png" height="12" width="12"></a>';
             mapLayerList += '&nbsp;&nbsp;<input id="'+sliderID+'" type="text" value="95" readonly="readonly" style="width:25px;height:10px;text-align:center;background-color:#ffffff;"/>';
             mapLayerList += '&nbsp;&nbsp;<a title="increase opacity" href="javascript:changeLayerOpacity(5,'+layerID+');"><img src="images/incOpacity.png" height="12" width="12"></a></td></tr>';
           }
           if (currentLayer.id == "USGS River Gages")  {
             layerID = j;
             var sliderID = "LyrSlider" + layerID; 
             mapLayerList += '<tr><td width="5"><input type="checkbox" id="lyr_USGS_Gages" name="lyr_USGS_Gages" value="true" checked onClick="removeFromMapLayerList()"></td><td>USGS River Gages</td>'; 
             mapLayerList += '<td><a title="decrease opacity" href="javascript:changeLayerOpacity(-5,'+layerID+');"><img src="images/decOpacity.png" height="12" width="12"></a>';
             mapLayerList += '&nbsp;&nbsp;<input id="'+sliderID+'" type="text" value="95" readonly="readonly" style="width:25px;height:10px;text-align:center;background-color:#ffffff;"/>';
             mapLayerList += '&nbsp;&nbsp;<a title="increase opacity" href="javascript:changeLayerOpacity(5,'+layerID+');"><img src="images/incOpacity.png" height="12" width="12"></a></td></tr>';
           }
         }
         mapLayerList += '</table>';
       }
     
       // write the contents of the mapLayerList variable to the floating window pane
       dojo.byId('layersDetails').innerHTML = mapLayerList;
     }

     function removeFromMapLayerList()  {
       var inputs = document.getElementsByTagName("input");
       for (var i=0;i<inputs.length;i++)  {
         if (inputs[i].getAttribute('type') == 'checkbox')  {
           var elementName = inputs[i].getAttribute('name');
           if (elementName == "lyr_NOAA_Chlorophyll")  {
             var nameElement = document.getElementById('lyr_NOAA_Chlorophyll');
             var nameValue = nameElement.checked;
             if (!nameValue)  dijit.byId('chlorophyll_thredds').setValue(false);
           }
           if (elementName == "lyr_NOAA_ChlorophyllAnomaly")  {
             var nameElement = document.getElementById('lyr_NOAA_ChlorophyllAnomaly');
             var nameValue = nameElement.checked;
             if (!nameValue)  dijit.byId('chlorophyll_anomaly').setValue(false);
           }
           if (elementName == "lyr_USF_Chl_Climo")  {
             var nameElement = document.getElementById('lyr_USF_Chl_Climo');
             var nameValue = nameElement.checked;
             if (!nameValue)  dijit.byId('chl_climo_usf').setValue(false);
           }
           if (elementName == "lyr_USF_RGB")  {
             var nameElement = document.getElementById('lyr_USF_RGB');
             var nameValue = nameElement.checked;
             if (!nameValue)  dijit.byId('ergb_usf').setValue(false);
           }
           if (elementName == "lyr_USF_NFLH")  {
             var nameElement = document.getElementById('lyr_USF_NFLH');
             var nameValue = nameElement.checked;
             if (!nameValue)  dijit.byId('nflh_usf').setValue(false);
           }
           if (elementName == "lyr_USF_SST")  {
             var nameElement = document.getElementById('lyr_USF_SST');
             var nameValue = nameElement.checked;
             if (!nameValue)  dijit.byId('sst_usf').setValue(false);
           }
           if (elementName == "lyr_NWS_Radar")  {
             var nameElement = document.getElementById('lyr_NWS_Radar');
             var nameValue = nameElement.checked;
             if (!nameValue)  dijit.byId('weatherRadar').setValue(false);
           }
           if (elementName == "lyr_NWS_AirTemp")  {
             var nameElement = document.getElementById('lyr_NWS_AirTemp');
             var nameValue = nameElement.checked;
             if (!nameValue)  dijit.byId('atmp').setValue(false);
           }
           if (elementName == "lyr_NWS_POP12")  {
             var nameElement = document.getElementById('lyr_NWS_POP12');
             var nameValue = nameElement.checked;
             if (!nameValue)  dijit.byId('pop12').setValue(false);
           }
           if (elementName == "lyr_NWS_QPF")  {
             var nameElement = document.getElementById('lyr_NWS_QPF');
             var nameValue = nameElement.checked;
             if (!nameValue)  dijit.byId('qpf').setValue(false);
           }
           if (elementName == "lyr_AMSEAS_SSH")  {
             var nameElement = document.getElementById('lyr_AMSEAS_SSH');
             var nameValue = nameElement.checked;
             if (!nameValue)  dijit.byId('ssh_forecast').setValue(false);
           }
           if (elementName == "lyr_AMSEAS_SSS")  {
             var nameElement = document.getElementById('lyr_AMSEAS_SSS');
             var nameValue = nameElement.checked;
             if (!nameValue)  dijit.byId('sss_forecast').setValue(false);
           }
           if (elementName == "lyr_AMSEAS_SST")  {
             var nameElement = document.getElementById('lyr_AMSEAS_SST');
             var nameValue = nameElement.checked;
             if (!nameValue)  dijit.byId('sst_forecast').setValue(false);
           }
           //if (elementName == "lyr_RI_Forecast")  {
           //  var nameElement = document.getElementById('lyr_RI_Forecast');
           //  var nameValue = nameElement.checked;
           //  if (!nameValue)  dijit.byId('ri_forecast').setValue(false);
           //}
           if (elementName == "lyr_latlongrid")  {
             var nameElement = document.getElementById('lyr_latlongrid');
             var nameValue = nameElement.checked;
             if (!nameValue)  dijit.byId('graticule').setValue(false);
           }
           if (elementName == "lyr_bathy")  {
             var nameElement = document.getElementById('lyr_bathy');
             var nameValue = nameElement.checked;
             if (!nameValue)  dijit.byId('bathymetry').setValue(false);
           }
           if (elementName == "lyr_WOA_wtmp")  {
             var nameElement = document.getElementById('lyr_WOA_wtmp');
             var nameValue = nameElement.checked;
             if (!nameValue)  dijit.byId('wtmp').setValue(false);
           }
           if (elementName == "lyr_NERRS")  {
             var nameElement = document.getElementById('lyr_NERRS');
             var nameValue = nameElement.checked;
             if (!nameValue)  dijit.byId('estuarine_reserves').setValue(false);
           }
           if (elementName == "lyr_NMSP")  {
             var nameElement = document.getElementById('lyr_NMSP');
             var nameValue = nameElement.checked;
             if (!nameValue)  dijit.byId('marine_sanctuaries').setValue(false);
           }
           if (elementName == "lyr_Oysters")  {
             var nameElement = document.getElementById('lyr_Oysters');
             var nameValue = nameElement.checked;
             if (!nameValue)  dijit.byId('shellfish_areas').setValue(false);
           }
           if (elementName == "lyr_NAMWinds")  {
             var nameElement = document.getElementById('lyr_NAMWinds');
             var nameValue = nameElement.checked;
             if (!nameValue)  dijit.byId('nam12Winds').setValue(false);
           }
           if (elementName == "lyr_AMSEAS_SSC")  {
             var nameElement = document.getElementById('lyr_AMSEAS_SSC');
             var nameValue = nameElement.checked;
             if (!nameValue)  dijit.byId('ssc_forecast').setValue(false);
           }
           if (elementName == "lyr_NDBC_buoys")  {
             var nameElement = document.getElementById('lyr_NDBC_buoys');
             var nameValue = nameElement.checked;
             if (!nameValue)  dijit.byId('buoys').setValue(false);
           }
           if (elementName == "lyr_NDBC_winds")  {
             var nameElement = document.getElementById('lyr_NDBC_winds');
             var nameValue = nameElement.checked;
             if (!nameValue)  dijit.byId('windsBuoys').setValue(false);
           }
           if (elementName == "lyr_TABS_currents")  {
             var nameElement = document.getElementById('lyr_TABS_currents');
             var nameValue = nameElement.checked;
             if (!nameValue)  dijit.byId('tabsBuoys').setValue(false);
           }
           if (elementName == "lyr_PORTS_currents")  {
             var nameElement = document.getElementById('lyr_PORTS_currents');
             var nameValue = nameElement.checked;
             if (!nameValue)  dijit.byId('portsBuoys').setValue(false);
           }
           if (elementName == "lyr_METAR")  {
             var nameElement = document.getElementById('lyr_METAR');
             var nameValue = nameElement.checked;
             if (!nameValue)  dijit.byId('metar').setValue(false);
           }
           if (elementName == "lyr_USGS_Gages")  {
             var nameElement = document.getElementById('lyr_USGS_Gages');
             var nameValue = nameElement.checked;
             if (!nameValue)  dijit.byId('usgsGages').setValue(false);
           }
         }
       }
       UpdateMap();
     }

     function drawLegend()  {
       var buoyLocations = dijit.byId('buoys').attr('value');
       var metarStations = dijit.byId('metar').attr('value');
       var riverGages = dijit.byId('usgsGages').attr('value');
       var currentsTABS = dijit.byId('tabsBuoys').attr('value');
       var currentsPORTS = dijit.byId('portsBuoys').attr('value');
       var windsBuoys = dijit.byId('windsBuoys').attr('value');
       var wtmp_historical = dijit.byId('wtmp').attr('value');
       var bathymetry = dijit.byId('bathymetry').attr('value');
       var atmp = dijit.byId('atmp').attr('value');
       var pop12 = dijit.byId('pop12').attr('value');
       var qpf = dijit.byId('qpf').attr('value');
       var nam12Winds = dijit.byId('nam12Winds').attr('value');
       var ssc_forecast = dijit.byId('ssc_forecast').attr('value');
       var ssh_forecast = dijit.byId('ssh_forecast').attr('value');
       var sss_forecast = dijit.byId('sss_forecast').attr('value');
       var sst_forecast = dijit.byId('sst_forecast').attr('value');
       var chlorophyll_thredds = dijit.byId('chlorophyll_thredds').attr('value');
       var chlorophyll_anomaly = dijit.byId('chlorophyll_anomaly').attr('value');
       var chl_climo_usf = dijit.byId('chl_climo_usf').attr('value');
       var sst_usf = dijit.byId('sst_usf').attr('value');
       var nflh_usf = dijit.byId('nflh_usf').attr('value');
       var estuarineReserves = dijit.byId('estuarine_reserves').attr('value');
       var marineSanctuaries = dijit.byId('marine_sanctuaries').attr('value');
       var shellfishAreas = dijit.byId('shellfish_areas').attr('value');

       var content = "";
       if (buoyLocations == "true")  {
         content += '<b>Buoys - NDBC</b><p/>';
         content += '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<img src="images/legends/buoys.png">';
         content += '<p/>';
       }
       if (metarStations == "true")  {
         content += '<b>METAR Stations</b><br/>';
         content += '<img src="images/legends/METARStations.bmp">';
         content += '<p/>';
       }
       if (riverGages == "true")  {
         content += '<b>River Gages</b><br/>';
         content += '<img src="images/legends/RiverGages.bmp">';
         content += '<p/>';
       }
       if (currentsTABS == "true")  {
         content += '<b>Currents - TABS</b><br/>';
         content += '<img src="images/legends/currentsTABS.bmp">';
         content += '<p/>';
       }
       if (currentsPORTS == "true")  {
         content += '<b>Currents - PORTS</b><br/>';
         content += '<img src="images/legends/currentsPORTS.bmp">';
         content += '<p/>';
       }
       if (nam12Winds == "true")  {
         content += '<b>Surface Winds - Forecasts</b><br/>';
         content += '<img src="images/legends/nam12Winds.gif">';
         content += '<p/>';
       }
       if (windsBuoys == "true")  {
         content += '<b>Winds - Buoys</b><br/>';
         content += '<img src="images/legends/buoywinds.gif">';
         content += '<p/>';
       }
       if (wtmp_historical == "true")  {
         content += '<b>Water Temperature - Historical</b><br/>';
         content += '<img src="images/legends/HistoricalWaterTemp.bmp">';
         content += '<p/>';
       }
       if (bathymetry == "true")  {
         content += '<b>Bathymetry</b><br/>';
         content += '<img src="images/legends/bathymetry.bmp">';
         content += '<p/>';
       }
       if (estuarineReserves == "true")  {
         content += '<b>Estuarine Reserves</b><br/>';
         content += '<img src="images/legends/nerrs.bmp">';
         content += '<p/>';
       }
       if (marineSanctuaries == "true")  {
         content += '<b>Marine Sanctuaries</b><br/>';
         content += '<img src="images/legends/nms.bmp">';
         content += '<p/>';
       }
       if (shellfishAreas == "true")  {
         content += '<b>Eastern Oyster Beds</b><br/>';
         content += '<img src="images/legends/shellfish_areas.bmp">';
         content += '<p/>';
       }
       if (atmp == "true")  {
         content += '<b>Air Temperature - Forecasts</b><br/>';
         content += '<img src="images/legends/ndfd_atmp.bmp">';
         content += '<p/>';
       }
       if (pop12 == "true")  {
         content += '<b>Probability of Precipitation - Forecasts</b><br/>';
         content += '<img src="images/legends/ndfd_pop12.bmp">';
         content += '<p/>';
       }
       if (qpf == "true")  {
         content += '<b>Precipitation Amount - Forecasts</b><br/>';
         content += '<img src="images/legends/ndfd_qpf.bmp">';
         content += '<p/>';
       }
       if (ssc_forecast == "true")  {
         content += '<b>Sea Surface Currents - Forecasts</b><br/>';
         content += '<img src="images/legends/iasnfs_ssc.bmp">';
         content += '<p/>';
       }
       if (ssh_forecast == "true")  {
         content += '<b>Sea Surface Heights - Forecasts</b><br/>';
         content += '<img src="images/legends/iasnfs_ssh.bmp">';
         content += '<p/>';
       }
       if (sss_forecast == "true")  {
         content += '<b>Sea Surface Salinity - Forecasts</b><br/>';
         content += '<img src="images/legends/iasnfs_sss.bmp">';
         content += '<p/>';
       }
       if (sst_forecast == "true")  {
         content += '<b>Water Temperatures - Forecasts</b><br/>';
         content += '<img src="images/legends/iasnfs_sst.bmp">';
         content += '<p/>';
       }
       if (chlorophyll_thredds == "true")  {
         content += '<b>Chlorophyll - NOAA CoastWatch</b><br/>';
         content += '<img src="images/legends/colorbar_chl_3day_compo.png">';
         content += '<p/>';
       }
       if (chlorophyll_anomaly == "true")  {
         content += '<b>60 Day Chlorophyll Anomaly - NOAA CoastWatch</b><br/>';
         content += '<img src="images/legends/colorbar_chl_60day_anomaly.png">';
         content += '<p/>';
       }
       if (chl_climo_usf == "true")  {
         content += '<b>Monthly Chlorophyll Climatology - USF</b><br/>';
         content += '<img src="images/legends/monthly_chl_climatology_USF.png">';
         content += '<p/>';
       }
       if (sst_usf == "true")  {
         content += '<b>Sea Surface Temperatures - USF</b><br/>';
         content += '<img src="images/legends/colorbar_sst_10_to_32.png">';
         content += '<p/>';
       }
       if (nflh_usf == "true")  {
         content += '<b>Normalized Fluorescence Line Height - USF</b><br/>';
         content += '<img src="images/legends/colorbar_flh_0.005_to_0.1.png">';
         content += '<p/>';
       }
       dojo.byId("Legend").innerHTML = content;
     }

     function getBuoyPage(buoy)  {
       var Win1 = open(buoy,"BuoyWindow","height=800,width=800,toolbar=no,menubar=no,location=no,scrollbars=yes,resizable=yes");
       Win1.focus();
     }

     function getHABSPage(habs)  {
       var Win1 = open(habs,"HABSDetailsWindow","height=800,width=800,toolbar=no,menubar=no,location=no,scrollbars=yes,resizable=yes");
       Win1.focus();
     }
     
     function zoomToStartExtent()  {
       map.setExtent(startExtent,true);
     }

     function changeOpacity()  {
       var layersOnMap = map.layerIds.length;
       var content = "";
       if (layersOnMap == 1)  {
         content += '<p/>';
         content += '<center>';
         content += 'You have not added any content to the map.';
         content += '<br>';
         content += 'Use the Add Layers tab to add content,';
         content += '<br>';
         content += 'then use this section to change the opacity settings of the layers drawn.';
         content += '<br>';
         content += '</center>';
       }
       else  {
         var count = 1;
         for (var j=map.layerIds.length-1;j>0;j--)  {
           var sliderID = "Slider"+j;
           var layerID = j;
           var currentLayer = map.getLayer(map.layerIds[j]);
           if (currentLayer.id.indexOf("basemap") != -1)  {
           }
           else  {
             content += '<b>';
             content += count;
             content += ') ';
             content += currentLayer.id;
             content += '</b>';
             content += '<br/>';
             //content += '<div id="'+sliderID+'" dojoType="dijit.form.HorizontalSlider" name="'+sliderID+'" onChange="changeTransparency(value,'+layerID+');" value="95" maximum="100" minimum="0" pageIncrement="100" showButtons="true" intermediateChanges="true" slideDuration="500" style="width:200px; height: 20px;"></div>';
             content += '&nbsp;&nbsp;&nbsp;&nbsp;Change Opacity:&nbsp;&nbsp;&nbsp;&nbsp;';
             content += '<a title="decrease opacity" href="javascript:changeTransparency(-5,'+layerID+');"><font size="3">-</font></a>&nbsp;&nbsp;&nbsp;&nbsp;';
             content += '<input id="'+sliderID+'" type="text" value="95" readonly="readonly" style="width: 30px; height: 15px; font: normal 12px arial; text-align: center; background-color: #ffffff;"/>';
             content += '&nbsp;&nbsp;&nbsp;&nbsp;<a title="increase opacity" href="javascript:changeTransparency(5,'+layerID+');"><font size="3">+</font></a>';
             content += '<p/>';
             //alert(content);
             count++;
           }
         }
         if (count > 2)  {
           content + '<p/>';
           content += '<table>';
           content += '<tr><td height="50"></td></tr>';
           content += '</table>';
           content += '<hr width="50%" />';
           content += '<center>';
           content += '<b>NOTE:</b><br/>';
           content += 'The layers are listed in the order in which they appear on the map, with #1 being on top, #2 below that, and so on.';
           content += '</center>';
         }
       }
       dojo.byId("changeOpacity").innerHTML = content;
     }

     function changeTransparency(newOpacity,layerID)  {
       var sliderID = "Slider" + layerID;
       var opacity = parseInt(document.getElementById(sliderID).value);
       var opacitySetting = opacity + newOpacity;
       if (opacitySetting > 100) opacitySetting = 100;
       if (opacitySetting < 0)  opacitySetting = 0;
       var newOpacityValue = document.getElementById(sliderID);
       newOpacityValue.value = opacitySetting;
       var opacityValue = opacitySetting/100;
       var layer = map.getLayer(map.layerIds[layerID]);
       layer.setOpacity(opacityValue);
       if (usingIE)  layer.refresh();
     }

     function changeLayerOpacity(newOpacity,layerID)  {
       var sliderID = "LyrSlider" + layerID;
       var opacity = parseInt(document.getElementById(sliderID).value);
       var opacitySetting = opacity + newOpacity;
       if (opacitySetting > 100) opacitySetting = 100;
       if (opacitySetting < 0)  opacitySetting = 0;
       var newOpacityValue = document.getElementById(sliderID);
       newOpacityValue.value = opacitySetting;
       var opacityValue = opacitySetting/100;
       var layer = map.getLayer(map.layerIds[layerID]);
       layer.setOpacity(opacityValue);
       if (usingIE)  layer.refresh();
     }

     function calculateDistanceTool()  {
       //alert("Calculate distance");
       var distanceOnOff = dijit.byId('distanceTool').attr('value');
       if (distanceOnOff == "true")  {
         calcDistanceListener = dojo.connect(map, "onClick", mapClickHandler);
       }
       else  {
         dojo.disconnect(calcDistanceListener);
       }
     }

     function mapClickHandler(evt) {
       //alert("X: " + evt.mapPoint.x + " Y: " + evt.mapPoint.y + " EPSG: " + map.spatialReference.wkid);
       var inPoint = new esri.geometry.Point(evt.mapPoint.x, evt.mapPoint.y, map.spatialReference);
       inputPoints.push(inPoint);
       //define the symbology for the graphics
       var markerSymbol = new esri.symbol.SimpleMarkerSymbol(esri.symbol.SimpleMarkerSymbol.STYLE_SQUARE, 12, new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([204, 102, 51]), 1), new dojo.Color([158, 184, 71, 0.65]));
       var polylineSymbol = new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([204, 102, 51]), 4);
       var font = new esri.symbol.Font("18px", esri.symbol.Font.STYLE_NORMAL, esri.symbol.Font.VARIANT_NORMAL, esri.symbol.Font.WEIGHT_BOLDER);
       var textSymbol;
         
       if (inputPoints.length === 1) { //start location label
         textSymbol = new esri.symbol.TextSymbol("Start", font, new dojo.Color([204, 102, 51]));
         textSymbol.yoffset = 8;
         startGraphic = new esri.Graphic(evt.mapPoint, textSymbol);
         map.graphics.add(startGraphic);
       }

       if (inputPoints.length >= 2) { //end location label
         textSymbol = new esri.symbol.TextSymbol("Finish", font, new dojo.Color([204, 102, 51]));
         textSymbol.yoffset = 8;
         if (endGraphic) { //if an end label already exists remove it
             map.graphics.remove(endGraphic);
         }
         endGraphic = new esri.Graphic(evt.mapPoint, textSymbol);
         map.graphics.add(endGraphic);
       }
          
       //add a graphic for the clicked location
       map.graphics.add(new esri.Graphic(evt.mapPoint, markerSymbol));

       //if there are two input points call the geometry service and perform the distance operation
       if (inputPoints.length >= 2) {
         dojo.style(dojo.byId("distanceDetails"), "display", "block");
         var distParams = new esri.tasks.DistanceParameters();
         distParams.distanceUnit = esri.tasks.GeometryService.UNIT_MILE;

         distParams.geometry1 = inputPoints[inputPoints.length - 2];
         distParams.geometry2 = inputPoints[inputPoints.length - 1];
         distParams.geodesic = true;

         //draw a polyline to connect the input points
         var polyline = new esri.geometry.Polyline(map.spatialReference);
         polyline.addPath([distParams.geometry1, distParams.geometry2]);
         map.graphics.add(new esri.Graphic(polyline, polylineSymbol));
         polyline = esri.geometry.webMercatorToGeographic(polyline);
         var miles = esri.geometry.geodesicLengths([polyline], esri.Units.MILES);
         var distance = parseFloat(dojo.number.format(miles, {places: 2}));         
         totalDistance += distance;
         var content = "";
         content += "<b>Total:</b> " + dojo.number.format(totalDistance, { places: 2 }) + " miles";
         dojo.byId('distanceDetails').innerHTML = content;
       }
     }

     function clearRoute()  {
       map.graphics.clear();
       inputPoints.length = 0;
       totalDistance = 0;
       dojo.byId("distanceDetails").innerHTML = "";
       dojo.style(dojo.byId("distanceDetails"), "display", "none");
       searchHABSOSDatabase();
     }

     function stopDistance()  {
       dojo.disconnect(calcDistanceListener);
     }

     function zoomInHandler()  {
       var zin = dijit.byId("zoomin");
       var zout = dijit.byId("zoomout");
       var pan = dijit.byId("pan");
       zout.set("checked", false);
       if (zin.checked)  {
         pan.set("checked", false);
         navToolbar.activate(esri.toolbars.Navigation.ZOOM_IN);
       }
       else  {
         navToolbar.deactivate();
         pan.set("checked", true);
       }
     }

     function zoomOutHandler()  {
       var zin = dijit.byId("zoomin");
       var zout = dijit.byId("zoomout");
       var pan = dijit.byId("pan");
       zin.set("checked", false);
       var zp = dijit.byId("zoomprev");
       var elm = dijit.byId("zoomout");
       if (zout.checked)
       {
         pan.set("checked", false);
         navToolbar.activate(esri.toolbars.Navigation.ZOOM_OUT);
       }
       else
       {
         navToolbar.deactivate();
         pan.set("checked", true);
       }
     }

     function stopZoomHandler()  {
       var zin = dijit.byId("zoomin");
       var zout = dijit.byId("zoomout");
       var pan = dijit.byId("pan");
       zin.set("checked", false);
       zout.set("checked", false);
       pan.set("checked", true);
       navToolbar.deactivate()
     }

     function zoomToStartExtentHandler()  {
       stopZoomHandler();
       map.setExtent(startExtent);
     }

     function prevExtentHandler()  {
       var elm = dijit.byId("zoomprev");
       stopZoomHandler();
       navToolbar.zoomToPrevExtent();
     }

     function nextExtentHandler()  {
       stopZoomHandler();
       navToolbar.zoomToNextExtent();
     }

     function panHandler()  {
       var pan = dijit.byId("pan");
       pan.set("checked", true);
       stopZoomHandler();
       navToolbar.activate(esri.toolbars.Navigation.PAN);
     }

     function dataDownloadPage()  {
       // get settings
       var fromDate = dijit.byId("fromDate").get('displayedValue');
       var toDate = dijit.byId("toDate").get('displayedValue');
       var x = map.extent.xmin;
       var y = map.extent.ymin;
       var num3 = x / 6378137.0;
       var num4 = num3 * 57.295779513082323;
       var num5 = Math.floor((num4 + 180.0) / 360.0);
       var num6 = num4 - (num5 * 360.0);
       var num7 = 1.5707963267948966 - (2.0 * Math.atan(Math.exp((-1.0 * y) / 6378137.0)));
       var west = num6;
       var south = num7 * 57.295779513082323;
       var x = map.extent.xmax;
       var y = map.extent.ymax;
       var num3 = x / 6378137.0;
       var num4 = num3 * 57.295779513082323;
       var num5 = Math.floor((num4 + 180.0) / 360.0);
       var num6 = num4 - (num5 * 360.0);
       var num7 = 1.5707963267948966 - (2.0 * Math.atan(Math.exp((-1.0 * y) / 6378137.0)));
       var east = num6;
       var north = num7 * 57.295779513082323;
       var downloadString = '<div class="dojoxFloatingPaneWrapper">';
       downloadString += '&nbsp;&nbsp;&nbsp;<b>Date Range:</b>';
       downloadString += '<table colspan="3">';
       downloadString += '<tr><td width="10">&nbsp;&nbsp;</td>';
       downloadString += '<td width="50" align="left">From:</td><td>';
       downloadString += fromDate;
       downloadString += '</td></tr>';
       downloadString += '<tr><td width="10">&nbsp;&nbsp;</td>';
       downloadString += '<td width="50" align="left">To:</td><td>';
       downloadString += toDate;
       downloadString += '</td></tr>';
       downloadString += '</table>';
       downloadString += '&nbsp;&nbsp;&nbsp;<b>Spatial Extent:</b>';
       downloadString += '<table colspan="3">';
       downloadString += '<tr><td width="10">&nbsp;&nbsp;</td>';
       downloadString += '<td width="50" align="left">North:</td><td>';
       downloadString += north.toFixed(4);
       downloadString += '</td></tr>';
       downloadString += '<tr><td width="10">&nbsp;&nbsp;</td>';
       downloadString += '<td width="50" align="left">South:</td><td>';
       downloadString += south.toFixed(4);
       downloadString += '</td></tr>';
       downloadString += '<tr><td width="10">&nbsp;&nbsp;</td>';
       downloadString += '<td width="50" align="left">East:</td><td>';
       downloadString += east.toFixed(4);
       downloadString += '</td></tr>';
       downloadString += '<tr><td width="10">&nbsp;&nbsp;</td>';
       downloadString += '<td width="50" align="left">West:</td><td>';
       downloadString += west.toFixed(4);
       downloadString += '</td></tr>';
       downloadString += '</table>';
       downloadString += '&nbsp;&nbsp;&nbsp;<b>Output Formats Available:</b>';      
       downloadString += '<table colspan="3">';
       downloadString += '<tr>';
       downloadString += '<td width="5">&nbsp;&nbsp;</td><td width="400" align="left"><input type="radio" name="outputFormat" id="htmlTable" value="htmlTable"/>html&nbsp;&nbsp;&nbsp;<input type="radio" name="outputFormat" id="csv" value="csv" checked/>csv&nbsp;&nbsp;&nbsp;<input type="radio" name="outputFormat" id="kml" value="kml"/>kml</td><td></td>';
       downloadString += '</tr>';
       downloadString += '</table>';
       downloadString += '<p/>';
       downloadString += '<center><button dojoType="dijit.form.Button" type="button" name="createDownloadFile" onClick="createERDDAPDownload();"><b>Submit Request</b></button></center>';
       downloadString += '<table colspan="2">';
       downloadString += '<tr><td="10">&nbsp;&nbsp;</td>';
       downloadString += '<td align="center">If these settings need to be changed, first close this menu. Use the map to modify settings. Reselect the "Data Download" icon.</td></tr>';
       downloadString += '</table>';
       downloadString += '</div>';
       pFloatingPane.attr("content",downloadString);
       pFloatingPane.show();
     }

     function createERDDAPDownload()  {
       // retrieve date range
       var fromDate = dijit.byId("fromDate").get('displayedValue');
       var toDate = dijit.byId("toDate").get('displayedValue');
       // retrieve current map extent
       var x = map.extent.xmin;
       var y = map.extent.ymin;
       var num3 = x / 6378137.0;
       var num4 = num3 * 57.295779513082323;
       var num5 = Math.floor((num4 + 180.0) / 360.0);
       var num6 = num4 - (num5 * 360.0);
       var num7 = 1.5707963267948966 - (2.0 * Math.atan(Math.exp((-1.0 * y) / 6378137.0)));
       var west = num6;
       var south = num7 * 57.295779513082323;
       var x = map.extent.xmax;
       var y = map.extent.ymax;
       var num3 = x / 6378137.0;
       var num4 = num3 * 57.295779513082323;
       var num5 = Math.floor((num4 + 180.0) / 360.0);
       var num6 = num4 - (num5 * 360.0);
       var num7 = 1.5707963267948966 - (2.0 * Math.atan(Math.exp((-1.0 * y) / 6378137.0)));
       var east = num6;
       var north = num7 * 57.295779513082323;

       // get spatial extent and date range to fill out parameters to send to erddap
       var listOfParameters = "";

       listOfParameters += '&latitude>=';
       listOfParameters += south;
       listOfParameters += '&latitude<=';
       listOfParameters += north;
       listOfParameters += '&longitude>=';
       listOfParameters += west;
       listOfParameters += '&longitude<=';
       listOfParameters += east;
       listOfParameters += '&sample_date>=';
       listOfParameters += fromDate;
       listOfParameters += 'T00:00:00Z';
       listOfParameters += '&sample_date<=';
       listOfParameters += toDate;
       listOfParameters += 'T23:59:59Z';

       // get the output file format
       var fileFormats = document.getElementsByName('outputFormat');
       var fileformat;
       for (var i=0; i<fileFormats.length; i++)  {
         if (fileFormats[i].checked)  {
           fileFormat = fileFormats[i].value;
         }
       }       
       
       // get a list of fields to be included in the output file
       var listOfFields = "category,cellcount,cellcount_qa,cellcount_unit,description,genus,latitude,longitude,qa_comment,salinity,salinity_qa,salinity_unit,sample_date,sample_depth,species,state_id,water_temp,water_temp_qa,water_temp_unit,wind_dir,wind_dir_qa,wind_dir_unit,wind_speed,wind_speed_qa,wind_speed_unit";

       // submit request to erddap
       var urlRequest = "";
       urlRequest += 'https://ecowatch.ncddc.noaa.gov/erddap/tabledap/habsos.';
       urlRequest += fileFormat;
       urlRequest += '?';
       urlRequest += listOfFields;
       urlRequest += listOfParameters;
       console.log(urlRequest);
       var Win = open(urlRequest,"_new");
     }

     function metadataPage()  {
       var metadataURL = "https://service.ncddc.noaa.gov/website/AGSViewers/HABSOS/metadata.htm";
       var Win = open(metadataURL,"MetadataMenu","height=800,width=850,toolbar=no,menubar=no,location=no,scrollbars=yes,resizable=yes");
       Win.focus();
     }

     function documentPage()  {
       var documentURL = "https://habsos.noaa.gov/help-window/";
       var Win = open(documentURL,"MapGuide","height=768,width=1024,toolbar=no,menubar=no,location=no,scrollbars=yes,resizable=yes");
       Win.focus();
     }

     function gotoMainPage()  {
       var mainPageURL = "https://habsos.noaa.gov";
       var Win = open(mainPageURL,"","height=768,width=1024,toolbar=yes,menubar=yes,location=yes,scrollbars=yes,resizable=yes");
       Win.focus();
     }
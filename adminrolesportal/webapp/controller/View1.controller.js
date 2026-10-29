sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    'sap/ui/model/Sorter',
    'sap/ui/export/library',
    'sap/ui/core/Fragment',
    'sap/ui/Device',
    'sap/ui/export/Spreadsheet'
],
    function (Controller, JSONModel, Filter, MessageToast, MessageBox, Sorter, exportLibrary, Fragment, Device, Spreadsheet) {
        var EdmType = exportLibrary.EdmType;

        return Controller.extend("com.claro.proveedores.adminrolesportal.controller.View1", {
            onInit: function () {
                this._mViewSettingsDialogs = {};
                this.getOwnerComponent().getRouter().getRoute("view1").attachPatternMatched(this._onObjectMatched, this);
                // sap.ui.getCore().getConfiguration().setLanguage("es");
            },

            _onObjectMatched: function () {
                this.i18n = this.getView().getModel("i18n").getResourceBundle();
                this.openBusyDialog();

                this.jsonDataUser = {
                    userName: "",
                    userCode: "",
                    userMail: ""
                };
                if (parent.sap.ushell !== undefined) {
                    var dataUser = parent.sap.ushell.Container.getUser();
                    var code = dataUser.getEmail() === undefined ? dataUser.getId() : dataUser.getEmail();
                    code = code.split("@")[0].toUpperCase();

                    this.jsonDataUser = {
                        userName: dataUser.getFullName(),
                        userCode: code,
                        userMail: dataUser.getEmail() === undefined ? "" : dataUser.getEmail()
                    };
                }

                this.jsonDataAuth0 = {
                    token_auth0: "",
                    url: ""
                };
                var oComponent = this.getOwnerComponent();
                this._router = oComponent.getRouter();

                var modelSettings = new JSONModel({
                    titluloRoles: this.i18n.getText("resultados", ["0"]),
                    enabledButtonTable: false
                });

                this.initArrayObjectView();

                this.getView().setModel(modelSettings, "modelSettings");

                this.getAccessText().then(function (respuestaAccessText) {
                    this.acciones = respuestaAccessText;
                    this.oActualizarVista();
                }.bind(this));
            },

            oActualizarVista: function () {
                this.openBusyDialog();
                var oModeloRolPortal = new JSONModel({
                    TITULO_TABLA: this.i18n.getText("resultados", ["0"]),
                    DATA: []
                });
                this.getView().setModel(oModeloRolPortal, "oModeloRolPortal");
                oModeloRolPortal.setDefaultBindingMode(sap.ui.model.BindingMode.OneWay);

                var url = this.getOwnerComponent().getManifestObject().resolveUri('../PORTAL_PROVEEDORES_REST/gProfilesLaunchpad');
                var settings = {
                    "url": url,
                    "method": "POST",
                    "headers": {
                        "Content-Type": "application/json"
                    },
                    "data": JSON.stringify({
                        "input": {}
                    })
                };

                $.ajax(settings).done(function (response) {
                    let dataResponse = response;
                    oModeloRolPortal.setData({
                        DATA: dataResponse
                    })
                    this.setTituloTabla();
                    oModeloRolPortal.refresh();
                    this.BusyDialog.close();
                }.bind(this)).fail(function (jqXHR, textStatus, errorThrown) {
                    this.setTituloTabla();
                    this.BusyDialog.close();
                }.bind(this));
            },

            initArrayObjectView: function () {

                this.arrayObjectView = [
                    {
                        id: "ipTITULOCrear",
                        required: true,
                        type: "ip"
                    }, {
                        id: "ipDESCRIPCIONCrear",
                        required: true,
                        type: "ip"
                    }, {
                        id: "idAplicacionesTable",
                        required: true,
                        type: "tb"
                    }];
                return;
            },

            openBusyDialog: function (oEvent) {
                if (!this.BusyDialog) {
                    this.BusyDialog = sap.ui.xmlfragment("com.claro.proveedores.adminrolesportal.view.fragments.BusyDialog", this);
                }

                jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this.BusyDialog);
                this.BusyDialog.open();
            },

            openBusyDialogCargando: function (oEvent) {
                // instantiate dialog
                if (!this.BusyDialogCargando) {
                    this.BusyDialogCargando = sap.ui.xmlfragment("com.claro.proveedores.adminrolesportal.view.fragments.BusyDialogCargando", this);
                }

                jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this.BusyDialogCargando);
                this.BusyDialogCargando.open();
            },

            openListAplicacionesView: function (oEvent) {

                this._oViewViewListAplicacionesDialog = sap.ui.xmlfragment("com.claro.proveedores.adminrolesportal.view.fragments.viewAplicaciones", this);
                var datosSeleccionados = oEvent.getSource().getBindingContext("oModeloRolPortal").getObject();

                this._oViewViewListAplicacionesDialog.open();
                this._oViewViewListAplicacionesDialog.setTitle(this.i18n.getText("listaAplicacionesRol", [datosSeleccionados.PROFILEID]));
                this._oViewViewListAplicacionesDialog.attachAfterClose(function () {
                    this.closeListAplicacionesView();
                }.bind(this));

                var modelViewAplicacion = new JSONModel([]);
                this._oViewViewListAplicacionesDialog.setModel(modelViewAplicacion, "modelViewAplicacion");

                modelViewAplicacion.setData(datosSeleccionados.APLICACIONES);
                modelViewAplicacion.refresh();
                sap.ui.getCore().byId("titleAplicacionesAsignadasId").setText(this.i18n.getText("aplicacionesContador", [datosSeleccionados.COUNT_APLICACIONES]));

            },

            closeListAplicacionesView: function () {
                this._oViewViewListAplicacionesDialog.destroy();
            },

            openListUsuariosEdit: function (oEvent) {
                this.itemSeleccionado = oEvent.getSource().getBindingContext("oModeloRolPortal").getObject();
                this.levantarPerfiles();
            },

            levantarPerfiles: function () {
                this._oViewListUsuariosEditDialog = sap.ui.xmlfragment("com.claro.proveedores.adminrolesportal.view.fragments.oListUsuariosEdit", this);
                var datosSeleccionados = this.itemSeleccionado;

                this._oViewListUsuariosEditDialog.open();
                this.profileIDSeleccion = datosSeleccionados.PROFILEID;
                this._oViewListUsuariosEditDialog.setTitle(this.i18n.getText("listaUsuariosRol", [datosSeleccionados.PROFILEID]));
                this._oViewListUsuariosEditDialog.attachAfterClose(function () {
                    this.closeListUsuariosEdit();
                }.bind(this));

                var toggleButton = sap.ui.getCore().byId("buttonDeletePerfilesId");
                toggleButton.setEnabled(false).setPressed(false);

                var modelListUsuariosEdit = new JSONModel([]);
                this._oViewListUsuariosEditDialog.setModel(modelListUsuariosEdit, "modelListUsuariosEdit");
                this._oViewListUsuariosEditDialog.setBusy(true);
                var url = this.getOwnerComponent().getManifestObject().resolveUri('../PORTAL_PROVEEDORES_REST/gProfilesUserLaunchpad');
                var settings = {
                    "url": url,
                    "method": "POST",
                    "headers": {
                        "Content-Type": "application/json"
                    },
                    "data": JSON.stringify({
                        "input": {
                            "PROFILEID": datosSeleccionados.PROFILEID
                        }
                    })
                };

                $.ajax(settings).done(function (response) {
                    let dataResponse = response;
                    modelListUsuariosEdit.setData(dataResponse);
                    modelListUsuariosEdit.refresh();
                    sap.ui.getCore().byId("titleUsuariosAsignadosId").setText(this.i18n.getText("usuariosContador", [dataResponse.length]));
                    if (dataResponse.length > 0) {
                        jQuery.sap.delayedCall(1000, this, function () {
                            toggleButton.setEnabled(true);
                            this._oViewListUsuariosEditDialog.setBusy(false);
                        }.bind(this));
                    } else {
                        this._oViewListUsuariosEditDialog.setBusy(false);
                    }
                }.bind(this)).fail(function (jqXHR, textStatus, errorThrown) {
                    this._oViewListUsuariosEditDialog.setBusy(false);
                }.bind(this));

            },

            closeListUsuariosEdit: function () {
                this._oViewListUsuariosEditDialog.destroy();
                this.oActualizarVista();
            },

            setTituloTabla: function () {
                var oModeloRolPortal = this.getView().getModel("oModeloRolPortal");
                var modelSettings = this.getView().getModel("modelSettings");
                var countData = oModeloRolPortal.getData().DATA.length;
                oModeloRolPortal.setProperty("/TITULO_TABLA", this.i18n.getText("resultados", [this.currencyValue(countData).toString()]));
                var cond = false;
                if (countData > 0) {
                    cond = true;
                }
                modelSettings.setProperty("/enabledButtonTable", cond);
                modelSettings.refresh();
                this.getView().byId("oTableRolId").getBinding("items").sort([new Sorter("DATA_AUTH0/updated_at", true)]);
            },

            setTituloTablaFilter: function (count) {
                var oModeloRolPortal = this.getView().getModel("oModeloRolPortal");
                var modelSettings = this.getView().getModel("modelSettings");
                var countData = count;
                oModeloRolPortal.setProperty("/TITULO_TABLA", this.i18n.getText("resultados", [this.currencyValue(countData).toString()]));
                var cond = false;
                if (countData > 0) {
                    cond = true;
                }
                modelSettings.setProperty("/enabledButtonTable", cond);
                modelSettings.refresh();
                this.getView().byId("oTableRolId").getBinding("items").sort([new Sorter("DATA_AUTH0/updated_at", true)]);
            },

            oupdateFinishedTitle: function (oEvent) {
                if (oEvent.getParameters().reason === "Filter") {
                    let total = oEvent.getParameters().total;
                    this.setTituloTablaFilter(total);
                }
            },

            onDialogoNuevoRol: function () {

                this._oViewAddRolesDialog = sap.ui.xmlfragment("com.claro.proveedores.adminrolesportal.view.fragments.AddRoles", this);
                this._oViewAddRolesDialog.attachAfterClose(function () {
                    this._dialogRolesClose();
                }.bind(this));
                this._oViewAddRolesDialog.open();
                var oModeloSeleccionAplicaciones = new JSONModel([]);
                this._oViewAddRolesDialog.setModel(oModeloSeleccionAplicaciones, "oModeloSeleccionAplicaciones")

                this._oViewAddRolesDialog.setModel(this.getView().getModel());

            },

            _dialogRolesClose: function () {
                this._oViewAddRolesDialog.destroy();
            },

            openListAplicaciones: function () {

                this._oViewListAplicacionesDialog = sap.ui.xmlfragment("com.claro.proveedores.adminrolesportal.view.fragments.listAplicaciones", this);
                this._oViewListAplicacionesDialog.attachAfterClose(function () {
                    this.onCancelarListAplicaciones();
                }.bind(this));

                this._oViewListAplicacionesDialog.open();
                var buttonAceptar = sap.ui.getCore().byId("ButtonAceptarApp");
                buttonAceptar.setEnabled(true);
                sap.ui.getCore().byId("searchFieldAplicacionesId").setValue("");
                this.contador = 0;
                this._oViewListAplicacionesDialog.setBusy(true);
                var modelAplicacion = new JSONModel([]);
                this._oViewListAplicacionesDialog.setModel(modelAplicacion, "modelAplicacion");

                var filter1 = new Filter({
                    path: "deleteStatus",
                    operator: sap.ui.model.FilterOperator.EQ,
                    value1: "1"
                });

                this.getView().getModel("modeloDatos").read("/AppsMaster", {
                    filters: [filter1],
                    success: function (oData) {
                        var respuesta = oData.results;
                        let functionRecorrer = function (items, i) {
                            if (items.length === i) {
                                this.applySelecctedItems().then(function () {
                                    var selectAllText = sap.ui.getCore().byId("seleccionarTodosId");
                                    if (respuesta.length > 0) {
                                        if (this.contador === respuesta.length) {
                                            selectAllText.setText(this.i18n.getText("deseleccionarTodos")).setSelected(true).setEnabled(true);
                                        } else {
                                            selectAllText.setText(this.i18n.getText("seleccionarTodos")).setSelected(false).setEnabled(true);
                                        }
                                    } else {
                                        selectAllText.setText(this.i18n.getText("sinDatos")).setSelected(false).setEnabled(false);
                                        buttonAceptar.setEnabled(false);
                                    }
                                    this._oViewListAplicacionesDialog.setBusy(false);
                                    this._oViewListAplicacionesDialog.setTitle(this.i18n.getText("listaAplicacionesContador", [respuesta.length]));
                                    modelAplicacion.refresh();
                                    this.setTextSeleccionados();
                                }.bind(this));
                            } else {
                                let item = items[i];
                                modelAplicacion.getData().push(item);
                                modelAplicacion.refresh();
                                // this._oViewListAplicacionesDialog.setTitle("Lista de Aplicaciones(" + modelAplicacion.getData().length + ")");
                                this._oViewListAplicacionesDialog.setTitle(this.i18n.getText("listaAplicaciones", [modelAplicacion.getData().length]));
                                item.SELECTED = false;
                                item.ENABLED_ACCIONES = false;
                                item.VISIBLE = true;
                                item.AplicacionTOAccionApp = {
                                    results: []
                                };
                                var filter2 = new Filter({
                                    path: "appID",
                                    operator: sap.ui.model.FilterOperator.EQ,
                                    value1: item.appID
                                });
                                this.getView().getModel("modeloDatos").read("/AppsAccess", {
                                    filters: [filter2],
                                    success: function (oData2) {
                                        var respuesta2 = oData2.results;
                                        item.AplicacionTOAccionApp.results = respuesta2;
                                        if (item.AplicacionTOAccionApp.results.length > 0) {
                                            item.AplicacionTOAccionApp.results.forEach(function (element2, index2) {
                                                element2.SELECTED = false;
                                                let tc = this.acciones.filter(function (f2) {
                                                    return f2.accessID === element2.accessID_accessID;
                                                }.bind(this));
                                                element2.Accion_AppTOAccion = {
                                                    NOMBRE: tc.length > 0 ? tc[0].description : ""
                                                }
                                                if (item.AplicacionTOAccionApp.results.length === (index2 + 1)) {
                                                    i++;
                                                    functionRecorrer(items, i);
                                                }
                                            }.bind(this));
                                        } else {
                                            i++;
                                            functionRecorrer(items, i);
                                        }
                                    }.bind(this),
                                    error: function (oError) {
                                        i++;
                                        functionRecorrer(items, i);
                                    }.bind(this)
                                });
                            }
                        }.bind(this);
                        if (respuesta.length > 0) {
                            functionRecorrer(respuesta, 0);
                        } else {

                        }

                    }.bind(this),
                    error: function (oError) {
                        modelAplicacion.setData([]);
                        modelAplicacion.refresh();
                        this._oViewListAplicacionesDialog.setBusy(false);
                    }.bind(this)
                });

                this.setTextSeleccionados();
                this._oViewListAplicacionesDialog.setModel(this.getView().getModel());

            },

            onCancelarListAplicaciones: function () {
                this._oViewListAplicacionesDialog.destroy();
            },

            onSelectCheckBox: function (oEvent) {

                var seleccion = oEvent.getSource().getSelected();
                var path = oEvent.getSource().getBindingContext("modelAplicacion").getPath();
                var modelo = this._oViewListAplicacionesDialog.getModel("modelAplicacion");

                if (seleccion) {
                    this.contador++;

                } else {
                    this.contador--;
                }

                modelo.setProperty(path + "/SELECTED", seleccion);
                modelo.setProperty(path + "/ENABLED_ACCIONES", seleccion);

                modelo.getProperty(path + "/AplicacionTOAccionApp/results/").forEach(function (element2, index) {
                    modelo.setProperty(path + "/AplicacionTOAccionApp/results/" + index + "/SELECTED", seleccion);
                });

                modelo.refresh();
                this.setTextSeleccionados();

            },

            seleccionaAcciones: function (oEvent) {
                var contadorAcciones = 0;
                var seleccion = oEvent.getSource().getSelected();
                var path = oEvent.getSource().getBindingContext("modelAplicacion").getPath();
                var modelo = this._oViewListAplicacionesDialog.getModel("modelAplicacion");
                var pathRecorrer = path.split("results/")[0];
                pathRecorrer = pathRecorrer + "results/";

                modelo.getProperty(pathRecorrer).forEach(function (element2, index) {
                    if (element2.SELECTED) {
                        contadorAcciones++;
                    }
                });

                var firstPath = pathRecorrer.split("/AplicacionTOAccionApp/results/")[0];

                if (contadorAcciones === 0) {

                    this.contador--;
                    modelo.setProperty(firstPath + "/SELECTED", false);
                    modelo.setProperty(firstPath + "/ENABLED_ACCIONES", false);
                }

                modelo.refresh();
                this.setTextSeleccionados();

            },

            _dialogRolesGuardar: function () {
                sap.ui.getCore().byId("btCrearRoles").setEnabled(false);
                var Titulo = sap.ui.getCore().byId("ipTITULOCrear").getValue().trim();
                var Descripcion = sap.ui.getCore().byId("ipDESCRIPCIONCrear").getValue().trim();
                var tokens = this._oViewAddRolesDialog.getModel("oModeloSeleccionAplicaciones").getData();
                let e = 0;
                if (!this.validar(this.arrayObjectView, "")) {
                    this.openBusyDialog();
                    this.consultaNombreRepetido(Titulo).then(function (respuestaConsultaNombreRepetido) {
                        if (respuestaConsultaNombreRepetido) {

                            let functionRecorrer = function (items, i) {
                                if (items.length === i) {
                                    sap.ui.getCore().byId("btCrearRoles").setEnabled(true);
                                    this.BusyDialog.close();
                                    if (e === 0) {
                                        this._dialogRolesClose();
                                        MessageToast.show(this.i18n.getText("rolCreadoCorrectamente"));
                                        this.oActualizarVista();
                                    } else {
                                        MessageToast.show(this.i18n.getText("errorCrearRol"));
                                    }
                                } else {
                                    let item = items[i];
                                    let functionRecorrer2 = function (items2, i2) {
                                        if (items2.length === i2) {
                                            i++;
                                            functionRecorrer(items, i);
                                        } else {
                                            let item2 = items2[i2];
                                            let jsonData = {
                                                "profileID": Titulo,
                                                "appID_appID": item.appID,
                                                "accessID_accessID": item2.accessID,
                                                "description": Descripcion,
                                                "deleteStatus": "1",
                                            }
                                            this.getView().getModel("modeloDatos").create('/Profiles', jsonData, {
                                                success: function (oResult) {
                                                    this.setLogSystem("Creación", "El sistema agregó correctamente un nuevo registro en la tabla DB_PROFILES", oResult).then(function () {
                                                        i2++;
                                                        functionRecorrer2(items2, i2);
                                                    }.bind(this));
                                                }.bind(this),
                                                error: function (oError) {
                                                    e++;
                                                    i2++;
                                                    functionRecorrer2(items2, i2);
                                                }.bind(this)
                                            });
                                        }
                                    }.bind(this);
                                    if (item.ARRAY_ACCIONES.length > 0) {
                                        functionRecorrer2(item.ARRAY_ACCIONES, 0);
                                    } else {
                                        i++;
                                        functionRecorrer(items, i);
                                    }
                                }
                            }.bind(this);
                            functionRecorrer(tokens, 0);
                        } else {
                            sap.ui.getCore().byId("btCrearRoles").setEnabled(true);
                            this.BusyDialog.close();
                            MessageToast.show(this.i18n.getText("nombreRolDuplicado"));
                        }
                    }.bind(this));
                } else {
                    MessageToast.show(this.i18n.getText("completeDatosObligatorios"));
                    jQuery.sap.delayedCall(3000, this, function () {
                        sap.ui.getCore().byId("btCrearRoles").setEnabled(true);
                        this.quitarState(this.arrayObjectView, "");
                    }.bind(this));
                }
            },

            onAceptarListAplicaciones: function () {
                var modelo = this._oViewListAplicacionesDialog.getModel("modelAplicacion");
                var oModeloSeleccionAplicaciones = this._oViewAddRolesDialog.getModel("oModeloSeleccionAplicaciones");
                modelo.getData().forEach(function (element, index) {
                    var acciones = "";
                    if (element.SELECTED) {

                        var json = {};

                        json.description = element.description;
                        json.appID = element.appID;
                        json.ARRAY_ACCIONES = [];

                        modelo.getProperty("/" + index + "/AplicacionTOAccionApp/results/").forEach(function (element2, index2) {
                            if (element2.SELECTED) {

                                var jsonAcciones = {
                                    accessID: element2.accessID_accessID
                                };
                                json.ARRAY_ACCIONES.push(jsonAcciones);
                                if (acciones.length > 0) {
                                    acciones = acciones + ", " + modelo.getProperty("/" + index + "/AplicacionTOAccionApp/results/" + index2 +
                                        "/Accion_AppTOAccion/NOMBRE");
                                } else {
                                    acciones = modelo.getProperty("/" + index + "/AplicacionTOAccionApp/results/" + index2 +
                                        "/Accion_AppTOAccion/NOMBRE");
                                }
                            }
                        });
                        json.ACCIONES = acciones;
                        oModeloSeleccionAplicaciones.getData().push(json);
                    }

                    this.onCancelarListAplicaciones();
                }.bind(this));
                oModeloSeleccionAplicaciones.refresh();
            },

            onLiveChangeListRol: function (oEvent) {
                var oTable = this.getView().byId("oTableRolId");
                var searchText = this.getView().byId("oSearchFieldRolId").getValue();
                var filters = [];

                if (searchText.trim() !== '') {

                    var filter2 = new Filter({
                        path: "PROFILEID",
                        operator: sap.ui.model.FilterOperator.Contains,
                        value1: searchText,
                        caseSensitive: false
                    });
                    var filter3 = new Filter({
                        path: "PROFILES_DESCRIPTION",
                        operator: sap.ui.model.FilterOperator.Contains,
                        value1: searchText,
                        caseSensitive: false
                    });
                    filters = new sap.ui.model.Filter({
                        filters: [filter2, filter3],
                        and: false
                    });

                }

                oTable.getBinding("items").filter(filters, sap.ui.model.FilterType.Application);

            },

            buscarAplicaciones: function (oEvent) {

                var oGrid = sap.ui.getCore().byId("gridAplicacionesId");
                var searchText = oEvent.getParameters().newValue;
                var filters = [];
                var oBindingInfo = oGrid.getBindingInfo("content");

                if (searchText.trim() !== '') {
                    var filter1 = new Filter({
                        path: "appID",
                        operator: sap.ui.model.FilterOperator.Contains,
                        value1: searchText,
                        caseSensitive: false
                    });
                    var filter2 = new Filter({
                        path: "description",
                        operator: sap.ui.model.FilterOperator.Contains,
                        value1: searchText,
                        caseSensitive: false
                    });

                    filters = [filter1, filter2];

                    var finalFilter = new sap.ui.model.Filter({
                        filters: filters,
                        and: false
                    });
                    //oBindingInfo.filters = finalFilter;
                    oGrid.getBinding("content").filter(finalFilter);
                } else {
                    //oBindingInfo.filters = [filter2];
                    oGrid.getBinding("content").filter([]);
                }

            },

            onDeleteApp: function (oEvent) {

                var oModeloSeleccionAplicaciones = this._oViewAddRolesDialog.getModel("oModeloSeleccionAplicaciones")
                var binding = oEvent.getParameters().listItem.getBindingContext("oModeloSeleccionAplicaciones");
                var path = binding.getPath();
                var pos = path.replace("/", "");
                pos = Number(pos);
                oModeloSeleccionAplicaciones.getData().splice(pos, 1);
                oModeloSeleccionAplicaciones.refresh();

            },

            conuntTitle: function (oEvent) {
                var iTotalItems = oEvent.getParameter("total");
                sap.ui.getCore().byId("titleAplicacionesId").setText(this.i18n.getText("aplicacionesContador", [iTotalItems]));
            },

            consultaNombreRepetido: function (nombre) {
                return new Promise(
                    function resolver(resolve, reject) {

                        var filteTitulo = new Filter({
                            path: "profileID",
                            operator: sap.ui.model.FilterOperator.EQ,
                            value1: nombre,
                        });

                        this.getView().getModel("modeloDatos").read("/Profiles", {
                            filters: [filteTitulo],
                            success: function (oData, response) {
                                var respuesta = oData.results;
                                if (respuesta.length === 0) {
                                    resolve(true);
                                } else {
                                    resolve(false);
                                }
                            }.bind(this),
                            error: function (oError) {
                                resolve(false);
                            }.bind(this)
                        });

                    }.bind(this));

            },

            getAccessText: function (nombre) {
                return new Promise(
                    function resolver(resolve, reject) {

                        var filteTitulo = new Filter({
                            path: "deleteStatus",
                            operator: sap.ui.model.FilterOperator.EQ,
                            value1: '1',
                        });

                        this.getView().getModel("modeloDatos").read("/AccessText", {
                            filters: [filteTitulo],
                            success: function (oData, response) {
                                var respuesta = oData.results;
                                resolve(respuesta);
                            }.bind(this),
                            error: function (oError) {
                                resolve([]);
                            }.bind(this)
                        });

                    }.bind(this));

            },

            applySelecctedItems: function () {
                var items = this._oViewAddRolesDialog.getModel("oModeloSeleccionAplicaciones");
                var modelo = this._oViewListAplicacionesDialog.getModel("modelAplicacion");
                return new Promise(
                    function resolver(resolve, reject) {

                        if (modelo.getData().length > 0) {
                            for (var i = 0; i < modelo.getData().length; i++) {
                                for (var a = 0; a < items.getData().length; a++) {
                                    if (modelo.getData()[i].appID === items.getData()[a].appID) {
                                        modelo.getData()[i].VISIBLE = false;
                                    }
                                }

                                if (i === modelo.getData().length - 1) {
                                    resolve();
                                }
                            }
                        } else {
                            resolve();
                        }

                    }.bind(this));

            },

            onSelectAll: function (oEvent) {
                var selected = oEvent.getSource().getSelected();
                this.desSelAll(selected);
            },

            desSelAll: function (condition) {
                var selectAllText = sap.ui.getCore().byId("seleccionarTodosId");
                var modelo = this._oViewListAplicacionesDialog.getModel("modelAplicacion");
                var data = modelo.getData();
                this.contador = 0;
                if (condition) {
                    selectAllText.setText("Deseleccionar Todos");
                } else {
                    selectAllText.setText("Seleccionar Todos");
                }

                data.forEach(function (element, index) {
                    if (element.VISIBLE) {

                        if (condition) {
                            this.contador++;
                        }
                        element.SELECTED = condition;
                        element.ENABLED_ACCIONES = condition;
                        modelo.getProperty("/" + index + "/AplicacionTOAccionApp/results/").forEach(function (element2, index2) {
                            modelo.setProperty("/" + index + "/AplicacionTOAccionApp/results/" + index2 + "/SELECTED", condition);
                        });
                    }
                }.bind(this));

                modelo.refresh();
                this.setTextSeleccionados();
            },

            setTextSeleccionados: function () {
                sap.ui.getCore().byId("seleccionadosId").setText(this.i18n.getText("seleccionados", [this.contador]));
            },

            currencyValue: function (value) {
                var formatNumber = {
                    separador: ".", // separador para los miles
                    sepDecimal: ',', // separador para los decimales
                    formatear: function (num) {
                        num += '';
                        var splitStr = num.split('.');
                        var splitLeft = splitStr[0];
                        var splitRight = splitStr.length > 1 ? this.sepDecimal + splitStr[1] : '';
                        var regx = /(\d+)(\d{3})/;
                        while (regx.test(splitLeft)) {
                            splitLeft = splitLeft.replace(regx, '$1' + this.separador + '$2');
                        }
                        return this.simbol + splitLeft + splitRight;
                    },
                    new: function (num, simbol) {
                        this.simbol = simbol || '';
                        return this.formatear(num);
                    }
                };

                var retorno = formatNumber.new(value, "");

                return retorno;
            },

            validar: function (fields, accion) {
                var error = false;
                for (var i = 0; i < fields.length; i++) {
                    var input = sap.ui.getCore().byId(fields[i].id + accion);
                    if (fields[i].type === "ip") {
                        var value = input.getValue();
                        if (value === "" || value.trim().length === 0) {
                            input.setValueState("Error");
                            error = true;
                        }
                    } else if (fields[i].type === "dt") {
                        var value = input.getDateValue();
                        if (value === null) {
                            input.setValueState("Error");
                            error = true;
                        }
                    } else if (fields[i].type === "tks") {
                        var value = input.getTokens();
                        if (value.length === 0) {
                            input.setValueState("Error");
                            error = true;
                        }
                    } else if (fields[i].type === "tb") {
                        var value = input.getItems();
                        if (value.length === 0) {
                            let info = input.getAggregation("infoToolbar");
                            let infoContent = info.getContent();
                            if (infoContent !== undefined) {
                                if (infoContent.length > 0) {
                                    info.setVisible(true);
                                }
                            }
                            error = true;
                        }
                    } else {
                        var value = input.getSelectedKey();
                        if (value === null) {
                            input.setValueState("Error");
                            error = true;
                        }
                    }

                }
                return error;
            },

            vaciar: function (fields, accion) {
                var error = false;
                for (var i = 0; i < fields.length; i++) {
                    var input = sap.ui.getCore().byId(fields[i].id + accion);
                    if (fields[i].type === "ip") {
                        input.setValue().setValueState("None");
                    } else if (fields[i].type === "dt") {
                        input.setValue().setValueState("None");
                    } else if (fields[i].type === "tks") {
                        input.destroyTokens().setValueState("None");
                    } else {
                        input.setSelectedKey().setValueState("None");
                    }
                }
                return error;
            },

            quitarState: function (fields, accion) {
                var error = false;
                for (var i = 0; i < fields.length; i++) {
                    var input = sap.ui.getCore().byId(fields[i].id + accion);
                    if (fields[i].type === "tb") {
                        let info = input.getAggregation("infoToolbar");
                        let infoContent = info.getContent();
                        if (infoContent !== undefined) {
                            if (infoContent.length > 0) {
                                info.setVisible(false);
                            }
                        }
                    } else {
                        input.setValueState("None");
                    }
                }
                return error;
            },

            upperCase: function (oEvent) {

                var objectInput = oEvent.getSource();
                var valor = objectInput.getValue().toUpperCase();
                valor = valor.replaceAll(" ", "_");
                objectInput.setValue(valor);
            },

            handleSortButtonPressed: function () {
                this.getViewSettingsDialog("com.claro.proveedores.adminrolesportal.view.fragments.dialogoSort")
                    .then(function (oViewSettingsDialog) {
                        oViewSettingsDialog.open();
                    });
            },

            handleFilterButtonPressed: function () {
                this.getViewSettingsDialog("com.claro.proveedores.adminrolesportal.view.fragments.dialogoFilter")
                    .then(function (oViewSettingsDialog) {
                        oViewSettingsDialog.open();

                        var data = this.getView().byId("oTableRolId").getModel("oModeloRolPortal").getData().DATA;

                        var model0 = new JSONModel(),
                            data0 = [],
                            model1 = new JSONModel(),
                            data1 = [];

                        if (data.length > 0) {
                            for (var i in data) {
                                data0.push({
                                    key: data[i].PROFILEID
                                });
                                data1.push({
                                    key: data[i].PROFILES_DESCRIPTION
                                });

                            }
                            model0.setData([...new Map(data0.map(item => [item['key'], item])).values()]);
                            model1.setData([...new Map(data1.map(item => [item['key'], item])).values()]);

                        }
                        oViewSettingsDialog.setModel(model0, "oModelFilter0");
                        oViewSettingsDialog.setModel(model1, "oModelFilter1");

                    }.bind(this));

            },

            getViewSettingsDialog: function (sDialogFragmentName) {

                var pDialog = this._mViewSettingsDialogs[sDialogFragmentName];
                if (!pDialog) {
                    pDialog = Fragment.load({
                        id: this.getView().getId(),
                        name: sDialogFragmentName,
                        controller: this
                    }).then(function (oDialog) {
                        if (Device.system.desktop) {
                            oDialog.addStyleClass("sapUiSizeCompact");
                        }

                        this.getView().addDependent(oDialog);
                        return oDialog;
                    }.bind(this));
                    this._mViewSettingsDialogs[sDialogFragmentName] = pDialog;
                }
                return pDialog;
            },

            handleSortDialogConfirm: function (oEvent) {

                var oTable = this.getView().byId("oTableRolId"),
                    mParams = oEvent.getParameters(),
                    oBinding = oTable.getBinding("items"),
                    sPath,
                    sText,
                    bDescending,
                    aSorters = [];

                if (mParams.sortItem !== undefined) {
                    sPath = mParams.sortItem.getKey();
                    sText = mParams.sortItem.getText();
                    bDescending = mParams.sortDescending;
                    aSorters.push(new Sorter(sPath, bDescending));

                    oBinding.sort(aSorters);
                }

            },

            handleFilterDialogConfirm: function (oEvent) {

                var oTable = this.getView().byId("oTableRolId"),
                    mParams = oEvent.getParameters(),
                    oBinding = oTable.getBinding("items"),
                    aFilters = [],
                    arrayText = [];

                if (mParams.filterItems !== undefined) {
                    mParams.filterItems.forEach(function (oItem) {
                        var aText = oItem.getParent().getText(),
                            sPath = oItem.getParent().getKey(),
                            sOperator = "EQ",
                            sValue1 = oItem.getKey(),
                            oFilter = new Filter(sPath, sOperator, sValue1);
                        aFilters.push(oFilter);
                        arrayText.push(aText);
                    });

                    // apply filter settings
                    oBinding.filter(aFilters);
                }
            },

            createColumnConfig: function () {
                var i18n = this.getView().getModel("i18n").getResourceBundle();

                return [
                    {
                        label: this.i18n.getText("titulo"),
                        property: 'PROFILEID',
                        type: EdmType.String
                    },
                    {
                        label: this.i18n.getText("descripcion"),
                        property: 'PROFILES_DESCRIPTION',
                        type: EdmType.String
                    }];
            },

            oDescargaExcel: function () {
                var aCols, oBinding, oSettings, oSheet, oTable;

                oTable = this.getView().byId('oTableRolId');
                oBinding = oTable.getBinding('items');
                aCols = this.createColumnConfig();

                oSettings = {
                    workbook: { columns: aCols },
                    fileName: 'RolesPortalProveedoresyContratistas.xlsx',
                    dataSource: oBinding
                };

                oSheet = new Spreadsheet(oSettings);
                oSheet.build().then(function () {
                    MessageToast.show(this.i18n.getText("descargaFinalizada"));
                }).finally(function () {
                    oSheet.destroy();
                });
            },

            grouperPerfiles: function (oGroup) {
                var json = {
                    key: ""
                };

                if (oGroup.oModel.oData[oGroup.sPath.split("/")[1]].DELETESTATUS !== "0") {
                    json.key = this.i18n.getText("asignacionesActivas");
                } else {
                    json.key = this.i18n.getText("asignacionesInactivas");
                }

                return json;

            },

            onSearchListPerfil: function (oEvent) {
                var oList = sap.ui.getCore().byId("listaPerfilesId");
                var searchText = sap.ui.getCore().byId("oSearchFieldListPerfilesId").getValue();
                var filters = [];

                if (searchText.trim() !== '') {
                    var filter1 = new Filter({
                        path: "EMAIL",
                        operator: sap.ui.model.FilterOperator.Contains,
                        value1: searchText,
                        caseSensitive: false
                    });
                    filters = [filter1];
                }
                var finalFilter = new sap.ui.model.Filter({
                    filters: filters,
                    and: false
                });

                if (filters.length === 0) {
                    finalFilter = [];
                }

                oList.getBinding("items").filter(finalFilter, sap.ui.model.FilterType.Application);

            },

            onPressToggleButtonDeletePerfiles: function () {

                var list = sap.ui.getCore().byId("listaPerfilesId");

                var mode = "None";
                if (list.getMode() === "None") {
                    mode = "Delete";
                }
                list.setMode(mode);

            },

            onChangeStatusPerfil: function (oEvent) {
                let item = oEvent;
                let source = item.getSource();
                this.sourceSeleccion = source;
                let parameters = item.getParameters();
                let objectSeleccion = source.getBindingContext("modelListUsuariosEdit").getObject();
                let profileid = this.profileIDSeleccion;
                let state = parameters.state;
                let param = {};
                param.USERID = objectSeleccion.USERID;
                param.PROFILEID = profileid;
                param.DELETESTATUS = state ? "1" : "0";

                MessageBox.show(this.i18n.getText("confirmarAccion"), {
                    icon: sap.m.MessageBox.Icon.QUESTION,
                    title: this.i18n.getText("aviso"),
                    actions: [this.i18n.getText("aceptar"), this.i18n.getText("cancelar")],
                    onClose: function (sAction) {
                        if (sAction === this.i18n.getText("aceptar")) {
                            this.openBusyDialog();
                            var url = this.getOwnerComponent().getManifestObject().resolveUri('../PORTAL_PROVEEDORES_REST/uStateUserProfiles');
                            var settings = {
                                "url": url,
                                "method": "POST",
                                "headers": {
                                    "Content-Type": "application/json"
                                },
                                "data": JSON.stringify({
                                    "input": param
                                })
                            };

                            $.ajax(settings).done(function (oDataRU) {
                                this.setLogSystem("Actualización", oDataRU.message, oDataRU.data).then(function () {
                                    var respuestaRU = oDataRU;
                                    this.BusyDialog.close();
                                    MessageToast.show(this.i18n.getText("procesoFinalizado"));
                                    this.closeListUsuariosEdit();
                                    this.levantarPerfiles();
                                }.bind(this));
                            }.bind(this)).fail(function (jqXHR, textStatus, errorThrown) {
                                this.BusyDialog.close();
                            }.bind(this));
                        } else {
                            this.sourceSeleccion.setState(!this.sourceSeleccion.getState());
                        }
                    }.bind(this)
                });
            },

            onPressButtonDeleteRol: function (oEvent) {
                let item = oEvent;
                let source = item.getSource();
                let objectSeleccion = source.getBindingContext("oModeloRolPortal").getObject();
                let profileid = objectSeleccion.PROFILEID;
                let param = {};
                param.PROFILEID = profileid;
                MessageBox.show(this.i18n.getText("confirmarAccion"), {
                    icon: sap.m.MessageBox.Icon.QUESTION,
                    title: this.i18n.getText("aviso"),
                    actions: [this.i18n.getText("aceptar"), this.i18n.getText("cancelar")],
                    onClose: function (sAction) {
                        if (sAction === this.i18n.getText("aceptar")) {
                            this.openBusyDialog();
                            var url = this.getOwnerComponent().getManifestObject().resolveUri('../PORTAL_PROVEEDORES_REST/dProfiles');
                            var settings = {
                                "url": url,
                                "method": "POST",
                                "headers": {
                                    "Content-Type": "application/json"
                                },
                                "data": JSON.stringify({
                                    "input": param
                                })
                            };

                            $.ajax(settings).done(function (oDataRU) {
                                this.setLogSystem("Eliminación", oDataRU.message, oDataRU.data).then(function () {
                                    var respuestaRU = oDataRU;
                                    this.BusyDialog.close();
                                    MessageToast.show(this.i18n.getText("procesoFinalizado"));
                                    this.oActualizarVista();
                                }.bind(this));
                            }.bind(this)).fail(function (jqXHR, textStatus, errorThrown) {
                                MessageToast.show(this.i18n.getText("errorProcesarAccion"));
                                this.BusyDialog.close();
                            }.bind(this));
                        }
                    }.bind(this)
                });
            },

            onDeletePerfilXUsuario: function (oEvent) {
                let item = oEvent;
                let source = item.getSource();
                let parameters = item.getParameters().listItem;
                this.sourceSeleccion = source;
                let objectSeleccion = parameters.getBindingContext("modelListUsuariosEdit").getObject();
                let profileid = this.profileIDSeleccion;
                let param = {};
                param.USERID = objectSeleccion.USERID;
                param.PROFILEID = profileid;
                MessageBox.show(this.i18n.getText("confirmarAccion"), {
                    icon: sap.m.MessageBox.Icon.QUESTION,
                    title: this.i18n.getText("aviso"),
                    actions: [this.i18n.getText("aceptar"), this.i18n.getText("cancelar")],
                    onClose: function (sAction) {
                        if (sAction === this.i18n.getText("aceptar")) {
                            this.openBusyDialog();
                            var url = this.getOwnerComponent().getManifestObject().resolveUri('../PORTAL_PROVEEDORES_REST/dUserProfiles');
                            var settings = {
                                "url": url,
                                "method": "POST",
                                "headers": {
                                    "Content-Type": "application/json"
                                },
                                "data": JSON.stringify({
                                    "input": param
                                })
                            };

                            $.ajax(settings).done(function (oDataRU) {
                                this.setLogSystem("Eliminación", oDataRU.message, oDataRU.data).then(function () {
                                    var respuestaRU = oDataRU;
                                    this.BusyDialog.close();
                                    MessageToast.show(this.i18n.getText("procesoFinalizado"));
                                    this.closeListUsuariosEdit();
                                    this.levantarPerfiles();
                                }.bind(this));
                            }.bind(this)).fail(function (jqXHR, textStatus, errorThrown) {
                                this.BusyDialog.close();
                            }.bind(this));
                        }
                    }.bind(this)
                });
            },

            getDateTime: function (fecha) {
                var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
                    style: 'medium',
                    UTC: true,
                    pattern: 'yyyy-MM-dd'
                });
                var dateFormatted = dateFormat.format(fecha);
                var salida = dateFormatted + "T" + this.addZero(fecha.getHours()) + ":" + this.addZero(fecha.getMinutes());
                return salida;
            },

            addZero: function (sValue) {
                if (sValue < 10) {
                    sValue = "0" + sValue;
                }
                return sValue;
            },

            setLogSystem: function (action, description, detail) {
                return new Promise(function (resolve) {
                    let mail = this.jsonDataUser.userMail;
                    let jsonData = {};

                    let uuid = self.crypto.randomUUID();
                    jsonData.ID = uuid; // Type="Edm.Guid" Nullable="false"/>
                    jsonData.creation_date = this.getDateTime(new Date()); // Type="Edm.DateTimeOffset"/>
                    jsonData.action = action; // Type="Edm.String" MaxLength="100"/>
                    jsonData.location = "Mantenedores"; // Type="Edm.String" MaxLength="50"/>
                    jsonData.description = description; // Type="Edm.String" MaxLength="999"/>
                    jsonData.creation_user = mail; // Type="Edm.String" MaxLength="255"/>
                    jsonData.app_description = "Administrador de roles"; // Type="Edm.String" MaxLength="999"/>
                    jsonData.detail = JSON.stringify(detail); // Type="Edm.String"/>
                    jsonData.deleteStatus = "1"; // Type="Edm.String" MaxLength="1"/>
                    this.getView().getModel("modeloDatos").create('/SystemLog', jsonData, {
                        success: function (oResult) {
                            resolve();
                        }.bind(this),
                        error: function (oError) {
                            resolve();
                        }.bind(this)
                    });
                }.bind(this));
            }


        });
    });
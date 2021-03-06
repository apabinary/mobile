/**
 * @name websocketService
 * @author Massih Hazrati
 * @contributors []
 * @since 10/15/2015
 * @copyright Binary Ltd
 * Handles websocket functionalities
 */

angular
    .module('binary')
    .factory('websocketService',
        function($rootScope, localStorageService, alertService, appStateService, $state, config) {
            var dataStream = '';
            var messageBuffer = [];

            var waitForConnection = function(callback, isAuthonticationRequest) {
                if (dataStream.readyState === 3) {
                    init();
                    if (!isAuthonticationRequest) {
                        setTimeout(function() {
                            waitForConnection(callback);
                        }, 1000);
                    }
                } else if (dataStream.readyState === 1) {
                    callback();
                } else if (!(dataStream instanceof WebSocket)) {
                    init();
                    if (!isAuthonticationRequest) {
                        setTimeout(function() {
                            waitForConnection(callback);
                        }, 1000);
                    }
                } else {
                    setTimeout(function() {
                        waitForConnection(callback);
                    }, 1000);
                }
            };

            var sendMessage = function(_data) {
                var token = localStorageService.getDefaultToken();
                waitForConnection(function() {
                    dataStream.send(JSON.stringify(_data));
                }, _data.hasOwnProperty('authorize') && token);
            };

            var init = function(forced) {
                forced = forced || false;
                var language = localStorage.language || 'en';

                if (dataStream && dataStream.readyState !== 3 && !forced) {
                    return;
                } else if (dataStream && dataStream.readyState !== 0) {
                    dataStream.close();
                }

                dataStream = null;

                appStateService.isLoggedin = false;

                dataStream = new WebSocket(config.wsUrl + '?app_id=' + config.app_id + '&l=' + language);

                dataStream.onopen = function() {


                    // Authorize the default token if it's exist
                    var token = localStorageService.getDefaultToken();
                    if (token) {
                        var data = {
                            authorize: token,
                            passthrough: {
                                type: "reopen-connection"
                            }
                        };
                        sendMessage(data);

                    }

                    console.log('socket is opened');
                    $rootScope.$broadcast('connection:ready');

                };

                dataStream.onmessage = function(message) {
                    receiveMessage(message);
                };

                dataStream.onclose = function(e) {
                    console.log('socket is closed ', e);
                    init();
                    console.log('socket is reopened');
                    appStateService.isLoggedin = false;
                    $rootScope.$broadcast('connection:reopened');
                };

                dataStream.onerror = function(e) {
                    if (e.target.readyState == 3) {
                        $rootScope.$broadcast('connection:error');
                    }
                    appStateService.isLoggedin = false;
                };

            };

            $rootScope.$on('language:updated', function() {
                init(true);
            })


            var websocketService = {};
            websocketService.authenticate = function(_token, extraParams) {
                extraParams = null || extraParams;
                appStateService.isLoggedin = false;

                var data = {
                    authorize: _token
                };

                for (key in extraParams) {
                    if (extraParams.hasOwnProperty(key)) {
                        data[key] = extraParams[key];
                    }
                }

                sendMessage(data);
            };

            websocketService.logout = function(){
              websocketService.sendRequestFor.logout();
				      localStorage.removeItem('accounts');
              websocketService.sendRequestFor.forgetProposals();
              sessionStorage.active_symbols = null;
              sessionStorage.asset_index = null;
              appStateService.isRealityChecked = false;
              appStateService.isChangedAccount = false;
              appStateService.isPopupOpen = false;
              appStateService.isCheckedAccountType = false;
              appStateService.isLoggedin = false;
              sessionStorage.removeItem('start');
              sessionStorage.removeItem('_interval');
              sessionStorage.removeItem('realityCheckStart');
              localStorage.removeItem('termsConditionsVersion');
              appStateService.profitTableRefresh = true;
              appStateService.statementRefresh = true;
              appStateService.isNewAccountReal = false;
              appStateService.isNewAccountMaltainvest = false;
              appStateService.hasMLT = false;
              sessionStorage.removeItem('countryParams');
              websocketService.closeConnection();
              appStateService.passwordChanged = false;
              appStateService.hasToRedirectToTermsAndConditions = false;
              appStateService.hasToRedirectToFinancialAssessment = false;
              appStateService.redirectFromFinancialAssessment = false;
              appStateService.limitsChange = false;
              appStateService.hasToRedirectToTaxInformation = false;

              appStateService.realityCheckLogin = false;

              $state.go('signin');
            };

            websocketService.sendRequestFor = {
              websiteStatus: function(){
                var data = {
                  "website_status": 1
                };
                sendMessage(data);
              },
              symbols: function() {
                var data = {
                  active_symbols: "brief"
                };
                sendMessage(data);
              },
              assetIndex: function() {
                var data = {
                  asset_index: 1
                };
                sendMessage(data);
              },
              currencies: function() {
                var data = {
                  payout_currencies: 1
                };
                sendMessage(data);
              },
              contractsForSymbol: function(_symbol) {
                var data = {
                  contracts_for: _symbol
                };
                sendMessage(data);
              },
              ticksForSymbol: function(_symbol) {
                var data = {
                  ticks: _symbol
                };
                sendMessage(data);
              },
              forgetAll: function(_stream) {
                var data = {
                  forget_all: _stream
                };
                sendMessage(data);
              },
              forgetStream: function(_id) {
                var data = {
                  forget: _id
                };
                sendMessage(data);
              },
              forgetProposals: function(reqId) {
                var data = {
                  forget_all: 'proposal',
                  req_id: reqId
                };
                sendMessage(data);
              },
              forgetTicks: function() {
                var data = {
                  forget_all: 'ticks'
                };
                sendMessage(data);
              },
              proposal: function(_proposal) {
                sendMessage(_proposal);
              },
              purchase: function(_proposalId, price) {
                var data = {
                  buy: _proposalId,
                  price: price || 0
                };
                sendMessage(data);
              },
              balance: function() {
                var data = {
                  balance: 1,
                  subscribe: 1
                };
                sendMessage(data);
              },
              portfolio: function() {
                var data = {
                  portfolio: 1
                };
                sendMessage(data);
              },
              profitTable: function(params, req_id) {
                var data = {
                  profit_table: 1
                };

                for (var key in params) {
                  if (params.hasOwnProperty(key)) {
                    data[key] = params[key]
                  }
                }

                sendMessage(data);
              },
              ticksHistory: function(data) {
                // data is the whole JSON convertable object parameter for the ticks_history API call
                if (data.ticks_history) {
                  sendMessage(data);
                }
              },
              openContract: function(contractId, extraParams) {
                var data = {};
                data.proposal_open_contract = 1;

                if (contractId) {
                  data.contract_id = contractId;
                }

                for (var key in extraParams) {
                  if (extraParams.hasOwnProperty(key)) {
                    data[key] = extraParams[key]
                  }
                }

                sendMessage(data);
              },
              sellExpiredContract: function() {
                var data = {
                  sell_expired: 1
                };

                sendMessage(data);
              },
              landingCompanyDetails: function(company) {
                var data = {
                  landing_company_details: company
                };
                sendMessage(data);
              },
              realityCheck: function() {
                var data = {
                  "reality_check": 1
                };
                sendMessage(data);
              },
              accountOpening: function(verifyEmail) {
                var data = {
                  "verify_email": verifyEmail,
                  "type": "account_opening"
                };
                sendMessage(data);
              },
              residenceListSend: function() {
                var data = {
                  "residence_list": 1
                };
                sendMessage(data);
              },
              newAccountVirtual: function(verificationCode, clientPassword, residence) {
                var data = {
                  "new_account_virtual": "1",
                  "verification_code": verificationCode,
                  "client_password": clientPassword,
                  "residence": residence
                };
                sendMessage(data);
              },
              accountSetting: function() {
                var data = {
                  "get_settings": 1
                };
                sendMessage(data);
              },
              setAccountSettings: function(data){
                data.set_settings = 1;

                sendMessage(data);
              },
              landingCompanySend: function(company) {
                var data = {
                  "landing_company": company
                };
                sendMessage(data);
              },
              statesListSend: function(countryCode) {
                var data = {
                  "states_list": countryCode
                };
                sendMessage(data);
              },
              createRealAccountSend: function(params) {
                var data = {
                  "new_account_real": "1"
                };
                for (var key in params) {
                  if (params.hasOwnProperty(key)) {
                    data[key] = params[key]
                  }
                };
                sendMessage(data);
              },
              createMaltainvestAccountSend: function(params) {
                var data = {
                  "new_account_maltainvest": "1"
                };
                for (var key in params) {
                  if (params.hasOwnProperty(key)) {
                    data[key] = params[key]
                  }
                };
                sendMessage(data);
              },
              statement: function(params) {
                var data = {
                  statement: 1
                };

                for (var key in params) {
                  if (params.hasOwnProperty(key)) {
                    data[key] = params[key]
                  }
                }

                sendMessage(data);
              },
              ping: function() {
                var data = {
                  ping: 1
                };
                sendMessage(data);
              },
              setSelfExclusion: function(params){
                var data = {
                  set_self_exclusion: 1
                }

                for( var key in params){
                  if(params.hasOwnProperty(key)){
                    data[key] = params[key];
                  }
                }

                sendMessage(data);
              },
              getSelfExclusion: function(){
                var data = {
                  get_self_exclusion: 1
                }

                sendMessage(data);
              },
              TAndCApprovalSend: function(){
                var data = {
                  tnc_approval: 1
                }
                sendMessage(data);
              },
              changePassword: function(_oldPassword, _newPassword){
                var data = {
                  "change_password": "1",
                  "old_password": _oldPassword,
                  "new_password": _newPassword
                }
                sendMessage(data);
              },
              getFinancialAssessment: function(){
                var data = {
                  "get_financial_assessment": 1
                }
                sendMessage(data);
              },
              setFinancialAssessment: function(params){
                var data = {
                  "set_financial_assessment": 1
                }

                for( var key in params){
                  if(params.hasOwnProperty(key)){
                    data[key] = params[key];
                  }
                }
                sendMessage(data);
              },
              tradingTimes: function(_date) {
                var data = {
                  "trading_times": _date
                }
                sendMessage(data);
              },
              getAccountStatus: function(){
                var data = {
                  "get_account_status": 1
                }
                sendMessage(data);
              },
              accountLimits: function(){
                var data = {
                  "get_limits": 1
                }
                sendMessage(data);
              },
              logout: function(){
                var data = {
                  "logout": 1
                }

                sendMessage(data);
              }
            }
            websocketService.closeConnection = function() {
                if (dataStream) {
                    dataStream.close();
                }
            };

            var receiveMessage = function(_response) {
                var message = JSON.parse(_response.data);

                if (message) {
                    if (message.error) {
                        if (message.error.code === 'InvalidToken') {
                            websocketService.logout();
                        }
                    }

                    var messageType = message.msg_type;
                    switch (messageType) {
                        case 'authorize':
                            if (message.authorize) {
                                message.authorize.token = message.echo_req.authorize;
                                window._trackJs.userId = message.authorize.loginid;
                                appStateService.isLoggedin = true;
                                appStateService.virtuality = message.authorize.is_virtual;
                                localStorage.landingCompanyName = message.authorize.landing_company_fullname;
                                appStateService.scopes = message.authorize.scopes;
                                amplitude.setUserId(message.authorize.loginid);

                                if (_.isEmpty(message.authorize.currency)) {
                                    websocketService.sendRequestFor.currencies();
                                } else {
                                    sessionStorage.currency = message.authorize.currency;
                                }

                                $rootScope.$broadcast('authorize', message.authorize, message['req_id'], message['passthrough']);
                            } else {
                                var errorMessage = "Unexpected Error!"
                                if (message.hasOwnProperty('error')) {
                                    localStorageService.removeToken(message.echo_req.authorize);
                                    errorMessage = message.error.message;
                                }
                                $rootScope.$broadcast('authorize', false, errorMessage);
                                appStateService.isLoggedin = false;
                            }
                            break;
                        case 'website_status':
                            $rootScope.$broadcast('website_status', message.website_status);
                            localStorage.termsConditionsVersion = message.website_status.terms_conditions_version;
                            break;
                        case 'active_symbols':
                            var markets = message.active_symbols;
                            var groupedMarkets = _.groupBy(markets, 'market');
                            var openMarkets = {};
                            for (var key in groupedMarkets) {
                                if (groupedMarkets.hasOwnProperty(key)) {
                                    if (groupedMarkets[key][0].exchange_is_open == 1) {
                                        openMarkets[key] = groupedMarkets[key];
                                    }
                                }
                            }
                            //if ( !sessionStorage.hasOwnProperty('active_symbols') || sessionStorage.active_symbols != JSON.stringify(openMarkets) ) {
                            sessionStorage.active_symbols = JSON.stringify(openMarkets);
                            sessionStorage.all_active_symbols = JSON.stringify(message.active_symbols);
                            $rootScope.$broadcast('symbols:updated', openMarkets);
                            //}
                            break;
                        case 'asset_index':
                            //if ( !sessionStorage.hasOwnProperty('asset_index') || sessionStorage.asset_index != JSON.stringify(message.asset_index) ) {
                            sessionStorage.asset_index = JSON.stringify(message.asset_index);
                            $rootScope.$broadcast('assetIndex:updated');
                            //}
                            break;
                        case 'payout_currencies':
                            $rootScope.$broadcast('currencies', message.payout_currencies);
                            break;
                        case 'proposal':
                            if (message.proposal) {
                                $rootScope.$broadcast('proposal', message.proposal, message.req_id);
                            } else if (message.error) {
                                $rootScope.$broadcast('proposal:error', message.error, message.req_id);
                            }
                            break;
                        case 'contracts_for':
                            var symbol = message.echo_req.contracts_for;
                            var groupedSymbol = _.groupBy(message.contracts_for.available, 'contract_category');
                            $rootScope.$broadcast('symbol', groupedSymbol);
                            break;
                        case 'buy':
                            if (message.error) {
                                $rootScope.$broadcast('purchase:error', message.error);
                                alertService.displayError(message.error.message);
                            } else {
                                $rootScope.$broadcast('purchase', message);
                            }
                            break;
                        case 'balance':
                            if (!(message.error)) {
                                $rootScope.$broadcast('balance', message.balance);
                            }
                            break;
                        case 'tick':
                            $rootScope.$broadcast('tick', message);
                            break;
                        case 'history':
                            $rootScope.$broadcast('history', message);
                            break;
                        case 'candles':
                            $rootScope.$broadcast('candles', message);
                            break;
                        case 'ohlc':
                            $rootScope.$broadcast('ohlc', message);
                            break;
                        case 'portfolio':
                            $rootScope.$broadcast('portfolio', message.portfolio);
                            break;
                        case 'profit_table':
                            if (message.profit_table) {
                            $rootScope.$broadcast('profit_table:update', message.profit_table, message.req_id);
                            } else if (message.error) {
                            $rootScope.$broadcast('profit_table:error', message.error.message);
                            }
                            break;
                        case 'sell_expired':
                            $rootScope.$broadcast('sell:expired', message.sell_expired);
                            break;
                        case 'proposal_open_contract':
                            $rootScope.$broadcast('proposal:open-contract', message.proposal_open_contract, message.req_id);
                            break;
                        case 'landing_company_details':
                            $rootScope.$broadcast('landing_company_details', message.landing_company_details);
                            break;
                        case 'reality_check':
                            $rootScope.$broadcast('reality_check', message.reality_check);
                            break;
                        case 'verify_email':
                            if (message.verify_email) {
                                $rootScope.$broadcast('verify_email', message.verify_email);
                            } else if (message.error) {
                                $rootScope.$broadcast('verify_email:error', message.error.details);
                            }
                            break;
                        case 'residence_list':
                            $rootScope.$broadcast('residence_list', message.residence_list);
                            break;
                        case 'new_account_virtual':
                            if (message.new_account_virtual) {
                                $rootScope.$broadcast('new_account_virtual', message.new_account_virtual);
                            } else if (message.error) {
                                $rootScope.$broadcast('new_account_virtual:error', message.error);
                            }
                            break;
                        case 'get_settings':
                            if(message.get_settings){
                              $rootScope.$broadcast('get_settings', message.get_settings);
                            }
                            else if(message.error){
                              $rootScope.$broadcast('get_settings:error', message.error.message);
                            }
                            break;
                        case 'landing_company':
                            $rootScope.$broadcast('landing_company', message.landing_company);
                            break;
                        case 'states_list':
                            $rootScope.$broadcast('states_list', message.states_list);
                            break;
                        case 'new_account_real':
                            if (message.new_account_real) {
                                $rootScope.$broadcast('new_account_real', message.new_account_real);
                            } else if (message.error) {
                                $rootScope.$broadcast('new_account_real:error', message.error);
                            }
                            break;
                        case 'new_account_maltainvest':
                            if (message.new_account_maltainvest) {
                                $rootScope.$broadcast('new_account_maltainvest', message.new_account_maltainvest);
                            } else if (message.error) {
                                $rootScope.$broadcast('new_account_maltainvest:error', message.error);
                            }
                            break;
                        case 'statement':
                            if (message.statement) {
                            $rootScope.$broadcast('statement:update', message.statement, message.req_id);
                            } else if (message.error) {
                            $rootScope.$broadcast('statement:error', message.error.message);
                            }
                            break;
                        case 'get_self_exclusion':
                            if(message.get_self_exclusion) {
                              $rootScope.$broadcast('get-self-exclusion', message.get_self_exclusion);
                            }
                            else if( message.error){
                              $rootScope.$broadcast('get-self-exclusion:error', message.error.message);
                            }
                            break;
                        case 'set_self_exclusion':
                            if(message.set_self_exclusion){
                              $rootScope.$broadcast('set-self-exclusion', message.set_self_exclusion);
                            }
                            else if(message.error){
                              $rootScope.$broadcast('set-self-exclusion:error', message.error.message);
                            }
                            break;
                        case 'set_settings':
                            if(message.set_settings){
                              $rootScope.$broadcast('set-settings', message.set_settings);
                            }
                            else if(message.error){
                              $rootScope.$broadcast('set-settings:error', message.error);
                            }
                            break;
                        case 'tnc_approval':
                            if(message.tnc_approval){
                              $rootScope.$broadcast('tnc_approval', message.tnc_approval);
                            }
                            else if(message.error){
                              $rootScope.$broadcast('tnc_approval:error', message.error);
                            }
                            break;
                        case 'change_password':
                            if(message.change_password){
                              $rootScope.$broadcast('change_password:success', message.change_password);
                            }
                            else if(message.error){
                              $rootScope.$broadcast('change_password:error', message.error);
                            }
                            break;
                        case 'get_financial_assessment':
                            if(message.get_financial_assessment){
                              $rootScope.$broadcast('get_financial_assessment:success', message.get_financial_assessment);
                            }
                            else if(message.error) {
                              $rootScope.$broadcast('get_financial_assessment:error', message.error);
                            }
                            break;
                        case 'set_financial_assessment':
                            if(message.set_financial_assessment) {
                              $rootScope.$broadcast('set_financial_assessment:success', message.set_financial_assessment);
                            }
                            else if (message.error){
                              $rootScope.$broadcast('set_financial_assessment:error', message.error);
                            }
                            break;
                        case 'get_account_status':
                            $rootScope.$broadcast('get_account_status', message.get_account_status);
                            break;
                        case 'get_limits':
                            $rootScope.$broadcast('get_limits', message.get_limits);
                            break;
                        case 'trading_times':
                            if(message.trading_times){
                              $rootScope.$broadcast('trading_times:success', message.trading_times);
                            }
                            else if(message.error){
                              $rootScope.$broadcast('trading_times:error', message.error);
                            }
                            break;
                        case 'forget_all':
                            $rootScope.$broadcast('forget_all', message.req_id);
                        default:
                    }
                }
            };

            return websocketService;
        });

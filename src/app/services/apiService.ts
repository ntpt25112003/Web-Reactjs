// services/apiService.ts
import { CapacitorHttp, HttpOptions } from '@capacitor/core';
import configService  from './configService';
import storageService, { StorageKey } from './storageService';
import appService from './appService';

class ApiService {
    private h_debug: boolean = true;
    private h_orgId: number = 8;
    private h_deviceType: number = 1;

    private m_beToken = '';
    private m_feToken = '';
    private m_fsToken = '';
    private m_datasourceId = -1;
    private m_datasourceId2 = -1;
    private m_datasourceId_config = -1;
    private m_datasourceId_chat = -1;

    async checkToken(): Promise<boolean> {
        this.m_beToken = (await storageService.get(StorageKey.TOKEN_BE)) || '';
        if (this.m_beToken.length === 0) return false;

        try {
        await this.getAllDatasource();
        } catch (e) {
        return false;
        }

        return true;
    }

    async loadCache() {
        this.m_beToken = await storageService.get(StorageKey.TOKEN_BE) || '';
        this.m_feToken = await storageService.get(StorageKey.TOKEN_FE) || '';
        this.m_fsToken = await storageService.get(StorageKey.TOKEN_FS) || '';
        this.m_datasourceId = await storageService.get(StorageKey.DATASOURCE, 'number') || -1;
        this.m_datasourceId2 = await storageService.get(StorageKey.DATASOURCE_2, 'number') || -1;
        this.m_datasourceId_config = await storageService.get(StorageKey.DATASOURCE_CONFIG, 'number') || -1;
        this.m_datasourceId_chat = await storageService.get(StorageKey.DATASOURCE_CHAT, 'number') || -1;
    
        // Log
        appService.log('[api.service] loadCache', {
        m_beToken: this.m_beToken,
        m_feToken: this.m_feToken,
        m_fsToken: this.m_fsToken,
        m_datasourceId: this.m_datasourceId,
        m_datasourceId2: this.m_datasourceId2,
        m_datasourceId_config: this.m_datasourceId_config,
        m_datasourceId_chat: this.m_datasourceId_chat,
        }, this.h_debug);
    }
    

    async cleanCache() {
        await Promise.all([
        storageService.remove(StorageKey.TOKEN_BE),
        storageService.remove(StorageKey.TOKEN_FE),
        storageService.remove(StorageKey.TOKEN_FS),
        storageService.remove(StorageKey.DATASOURCE),
        storageService.remove(StorageKey.DATASOURCE_2),
        storageService.remove(StorageKey.DATASOURCE_CHAT),
        storageService.remove(StorageKey.DATASOURCE_CONFIG),
        ]);
    }
    getBE(): string {
        return configService.SITE_REL ? configService.BE_REL_URL : configService.SITE_TEST ? configService.BE_TEST_URL : configService.BE_DEV_URL;
    }
    
    getBE2(): string {
        return configService.SITE_REL ? configService.B2_REL_URL : configService.SITE_TEST ? configService.B2_TEST_URL : configService.B2_DEV_URL;
    }
    
    getFE(): string {
        return configService.SITE_REL ? configService.FE_REL_URL : configService.SITE_TEST ? configService.FE_TEST_URL : configService.FE_DEV_URL;
    }
    
    getFS(): string {
        return configService.SITE_REL? configService.FS_REL_URL: configService.SITE_TEST? configService.FS_TEST_URL : configService.FS_DEV_URL;
    }
    
    setBEToken(token: string, isSave: boolean = false) {
        this.m_beToken = token;
        if (isSave) storageService.set(StorageKey.TOKEN_BE, token);
    }
    
    setFEToken(token: string, isSave: boolean = false) {
        this.m_feToken = token;
        if (isSave) storageService.set(StorageKey.TOKEN_FE, token);
    }
    
    setFSToken(token: string, isSave: boolean = false) {
        this.m_fsToken = token;
        if (isSave) storageService.set(StorageKey.TOKEN_FS, token);
    }
    
    async setDatasourceFromAPI(isSave: boolean = false) {
        const log: any = { isSave };
      
        try {
          // Call API
          const lstDatasource = await this.getAllDatasource();
          log.lstDatasource = lstDatasource;
      
          // Find
          const datasource = lstDatasource.find((ds: any) => ds.code === configService.DATASOURCE);
          const datasource_2 = lstDatasource.find((ds: any) => ds.code === configService.DATASOURCE_2);
          const datasource_chat = lstDatasource.find((ds: any) => ds.code === configService.DATASOURCE_CHAT);
      
          const datasourceConfigCode = configService.SITE_REL
            ? configService.DATASOURCE_CONFIG_REL
            : configService.SITE_TEST
            ? configService.DATASOURCE_CONFIG_TEST
            : configService.DATASOURCE_CONFIG_DEV;
      
          const datasource_config = lstDatasource.find((ds: any) => ds.code === datasourceConfigCode);

          log.datasource = datasource;
          log.datasource_chat = datasource_chat;
          log.datasource_config = datasource_config;
      
          // Validate
          if (!datasource?.id || datasource.id < 0)
            throw { error: true, msgCode: 'login.err_datasource_notfound', detail: configService.DATASOURCE };
          if (!datasource_2?.id || datasource_2.id < 0)
            throw { error: true, msgCode: 'login.err_datasource_notfound', detail: configService.DATASOURCE_2 };
          if (!datasource_config?.id || datasource_config.id < 0)
            throw { error: true, msgCode: 'login.err_datasource_notfound', detail: datasourceConfigCode };
          if (!datasource_chat?.id || datasource_chat.id < 0)
            throw { error: true, msgCode: 'login.err_datasource_notfound', detail: configService.DATASOURCE_CHAT };
      
          // Set
          this.m_datasourceId = datasource.id;
          this.m_datasourceId2 = datasource_2.id;
          this.m_datasourceId_config = datasource_config.id;
          this.m_datasourceId_chat = datasource_chat.id;
          if (isSave) {
            storageService.set(StorageKey.DATASOURCE, datasource.id);
            storageService.set(StorageKey.DATASOURCE_2, datasource_2.id);
            storageService.set(StorageKey.DATASOURCE_CONFIG, datasource_config.id);
            storageService.set(StorageKey.DATASOURCE_CHAT, datasource_chat.id);
          }
        } 
        catch (e: any) {
          log.error = e;
          throw e;
        } 
        finally {
          appService.log('[api.service] setDatasourceFromAPI', log, this.h_debug);
        }
    }
    
    getToken() {
        return {
          beToken: this.m_beToken,
          feToken: this.m_feToken,
          fsToken: this.m_fsToken,
        };
    }
      
    getDataSource(): number {
        switch (appService.m_moduleNumber) {
          case 1: return this.m_datasourceId;
          case 2: return this.m_datasourceId2;
          default: return this.m_datasourceId;
        }
    }
      
    getDataSourceConfig(): number {
        return this.m_datasourceId_config;
    }
      
    getDataSourceChat(): number {
        return this.m_datasourceId_chat;
    }
      
    getSiteId(): number {
        switch (appService.m_moduleNumber) {
          case 1: return configService.SITE_ID;
          case 2: return configService.SITE_ID_2;
          default: return configService.SITE_ID;
        }
    }
      
    getSiteCode(): string {
        switch (appService.m_moduleNumber) {
          case 1: return configService.SITE_CODE;
          case 2: return configService.SITE_CODE_2;
          default: return configService.SITE_CODE;
        }
    }
      
    // Dynamic API
    async request(
        method: 'GET' | 'POST',
        apiCode: string,
        body: any,
        anonymous: boolean = false
      ): Promise<any> {
        const log: any = { method, apiCode, body, anonymous };
      
        try {
          // Headers
          const headers: any = { 'Content-Type': 'application/json; charset=utf-8' };
          if (!anonymous) {
            headers['Authorization'] = 'Bearer ' + this.m_beToken;
          }
      
          // Build Request
          const request: HttpOptions = {
            method: method,
            url: this.getBE() + '/hin-api-service/' + apiCode,
            headers,
            data: body,
          };
          log.request = request;
      
          // Call API
          const response = await CapacitorHttp.request(request);
          log.response = response;
      
          this.processResponse(response);
      
          // Handle Response
          if (response && response.status === 200) {
            const data = response.data;
            if (data?.success && data.result?.isSucceeded) {
              const resultData = data.result.data;
              if (Array.isArray(resultData) && resultData.length > 0) {
                const res = resultData[0];
                if (res?.response && res.response.length > 0) {
                  return JSON.parse(res.response);
                }
              }
            }
          }
          throw { request, response };
        } catch (e: any) {
          log.error = e;
          this.processException(e);
          throw e;
        } finally {
          appService.log('[api.service] request', log, this.h_debug);
        }
      }
      
    // System
    async getSystemConfig(codeGroup: string, key: string): Promise<any> {
        const log: any = { codeGroup, key };
        try {
            // Request
            const request: HttpOptions = {
                method: 'GET',
                url: this.getBE() + '/api/services/app/AbpHardDatasources/getSystemConfig',
                headers: { Authorization: 'Bearer ' + this.m_beToken },
                params: {
                codeGroup,
                key,
                },
            };
            log.request = request;

            // Call API
            const response = await CapacitorHttp.request(request);
            log.response = response;
            this.processResponse(response);

            // Return
            if (!response || response.status !== 200 || !response.data) {
                throw { request, response };
            }
            const data = response.data;
            if (!data.success || !data.result) {
                throw data;
            }
            const result = data.result;
            if (!result.isSucceeded) {
                throw result;
            }
            if (!result.data) {
                throw await appService.lang('exception.harddatasource_notfound', {
                code: `${codeGroup}.${key}`,
                });
            }
            return result.data.value;
            } catch (e: any) {
            log.error = e;
            this.processException(e);
            throw e;
            } finally {
            appService.log('[api.service] getSystemConfig', log, this.h_debug);
        }
    }
      
    async authenticate(username: string, password: string): Promise<any> {
        const log: any = { username, password };
      
        try {
          const request: HttpOptions = {
            method: 'POST',
            url: this.getBE() + '/api/TokenAuth/Authenticate',
            headers: {
              'Content-Type': 'application/json; charset=utf-8',
            },
            data: {
              userNameOrEmailAddress: username,
              password: password,
              rememberClient: 'true',
            },
            connectTimeout: 10000,
          };
          log.request = request;
      
          const response = await CapacitorHttp.request(request);
          log.response = response;
      
          this.processResponse(response);
      
          if (response.status === 200) {
            const data = response.data;
            if (data.success && data.result != null) {
              return data.result;
            }
          } else if (response.status === 500) {
            const data = response.data;
            if (data.success === false) {
              const error = data.error;
              if (error && error.code === 0) {
                throw {
                  error: true,
                  msg: 'Tài khoản hoặc mật khẩu không chính xác!',
                  detail: log,
                };
              }
            }
          }
      
          throw { request, response };
        } catch (e: any) {
          log.error = e;
          this.processException(e);
          throw e;
        } finally {
          appService.log('[api.service] Authenticate', log, this.h_debug);
        }
    }

    async accountRegister(
        firstname: string,
        lastname: string,
        username: string,
        email: string,
        password: string,
        roleName: string
      ): Promise<void> {
        const log: any = { firstname, lastname, username, email, password, roleName };
        try {
          const request: HttpOptions = {
            method: 'POST',
            url: this.getBE() + '/api/services/app/Account/Register',
            headers: { 'content-type': 'application/json' },
            data: {
              name: firstname,
              surname: lastname,
              userName: username,
              emailAddress: email,
              password,
              roleNames: [roleName],
            },
          };
          log.request = request;
      
          const response = await CapacitorHttp.request(request);
          log.response = response;
      
          this.processResponse(response);
      
          const data = response.data;
      
          if (response.status === 200 && data.success) {
            return; // Register success
          } else if (response.status === 500) {
            const errMsg: string = data.error?.message || '';
            if (errMsg.includes('is already taken')) {
              throw {
                error: true,
                msg: `Tài khoản "${username}" đã được đăng ký!`,
              };
            }
          }
      
          throw { request, response };
        } catch (e: any) {
          log.error = e;
          this.processException(e);
          throw e;
        } finally {
          appService.log('[api.service] accountRegister', log, this.h_debug);
        }
    }   
      
    async getAllDatasource(): Promise<any[]> {
        const log: any = {};
      
        try {
          const request: HttpOptions = {
            method: 'GET',
            url: this.getBE() + '/api/services/app/DRDataSource/GetAllDataSources',
            headers: {
              'Content-Type': 'application/json;charset=utf-8',
              Authorization: 'Bearer ' + this.m_beToken,
            },
          };
          log.request = request;
      
          const response = await CapacitorHttp.request(request);
          log.response = response;
      
          this.processResponse(response);
      
          if (response.status === 200) {
            const data = response.data;
            if (data && data.success) {
              return data.result || [];
            }
          }
      
          throw { request, response };
        } catch (e: any) {
          log.error = e;
          this.processException(e);
          throw e;
        } finally {
          appService.log('[api.service] getAllDatasource', log, this.h_debug);
        }
    }
      
    async getConfigGroupDetail(groupCode: string): Promise<any[]> {
        const log: any = { groupCode };
      
        try {
          const request: HttpOptions = {
            method: 'GET',
            url: this.getBE() + '/api/services/app/DRViewerUtility/GetConfigGroupDetailByGroupCode',
            headers: {
              'Content-Type': 'application/json;charset=utf-8;',
            },
            params: {
              GroupCode: groupCode,
            },
          };
          log.request = request;
      
          const response = await CapacitorHttp.request(request);
          log.response = response;
      
          if (response && response.status === 200) {
            const data = response.data;
            if (data.success && data.result) {
              const result = data.result;
              if (result.isSucceeded && result.data) {
                return result.data; // Trả danh sách cấu hình
              }
            }
          }
      
          throw { request, response };
        } catch (e: any) {
          log.error = e;
          throw e;
        } finally {
          appService.log('[api.service] getConfigGroupDetail', log, this.h_debug);
        }
    }
    
    // User
    async getUserInfo(userId: number): Promise<any> {
        const log: any = { userId };
    
        try {
          const request: HttpOptions = {
            method: 'GET',
            url: this.getBE() + '/api/services/app/User/GetWithApiKey',
            headers: { 'Authorization': 'Bearer ' + this.m_beToken },
            params: { id: userId.toString() },
          };
          log.request = request;
    
          const response = await CapacitorHttp.request(request);
          log.response = response;
          this.processResponse(response);
    
          if (response.status === 200) {
            const data = response.data;
            if (data && data.success) return data.result;
          }
          throw { request, response };
        } catch (e: any) {
          log.error = e;
          this.processException(e);
          throw e;
        } finally {
          appService.log('[api.service] getUserInfo', log, this.h_debug);
        }
    }
    
    async getRole(userId: number): Promise<any[]> {
        const log: any = { userId };
    
        try {
          const request: HttpOptions = {
            method: 'GET',
            url: this.getBE() + '/api/services/app/User/GetRoleByUserId',
            headers: { 'Authorization': 'Bearer ' + this.m_beToken },
            params: { UserId: userId.toString() },
          };
          log.request = request;
    
          const response = await CapacitorHttp.request(request);
          log.response = response;
          this.processResponse(response);
    
          if (response.status === 200) {
            const data = response.data;
            if (data && data.success) {
              const result = data.result;
              if (result?.isSucceeded && result.data) return result.data;
            }
          }
          throw { request, response };
        } catch (e: any) {
          log.error = e;
          this.processException(e);
          throw e;
        } finally {
          appService.log('[api.service] getRole', log, this.h_debug);
        }
    }
    
    async getAvatar(): Promise<string> {
        const log: any = {};
    
        try {
          const request: HttpOptions = {
            method: 'GET',
            url: this.getBE() + '/api/services/app/Profile/GetProfilePicture',
            headers: {
              'Content-Type': 'application/json; charset=utf-8',
              'Authorization': 'Bearer ' + this.m_beToken,
            },
          };
          log.request = request;
    
          const response = await CapacitorHttp.request(request);
          log.response = response;
          this.processResponse(response);
    
          if (response && response.status === 200) {
            const data = response.data;
            if (data.success) {
              return data.result || '';
            }
          }
    
          throw { request, response };
        } catch (e: any) {
          log.error = e;
          this.processException(e);
        } finally {
          appService.log('[api.service] getAvatar', log, this.h_debug);
        }
        return '';
    }
    
    async updateFirebaseToken(token: string, model: string, manufacturer: string, platform: string, identifier: string) {
        const log: any = { token, model, manufacturer, platform, identifier };
    
        try {
          const request: HttpOptions = {
            method: 'POST',
            url: this.getBE() + '/api/services/app/User/ChangeTokenFirebase',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ' + this.m_beToken,
            },
            data: {
                'fireToken': token,
                'model': model,
                'manufacturer': manufacturer,
                'uuid': identifier,
                'platform': platform
            },
          };
          log.request = request;
    
          const response = await CapacitorHttp.request(request);
          log.response = response;
          this.processResponse(response);
        } catch (e: any) {
          log.error = e;
          this.processException(e);
          throw e;
        } finally {
          appService.log('[api.service] updateFirebaseToken', log, this.h_debug);
        }
    }

    async RemoveFirebaseToken(token: string) {
        const log: any = {};
    
        try {
          const request: HttpOptions = {
            method: 'POST',
            url: this.getBE() + '/api/services/app/User/RemoveTokenFirebase',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ' + this.m_beToken,
            },
            data: {
              fireToken: token,
            },
          };
          log.request = request;
    
          const response = await CapacitorHttp.request(request);
          log.response = response;
          this.processResponse(response);
        } catch (e: any) {
          log.error = e;
          this.processException(e);
          throw e;
        } finally {
          appService.log('[api.service] RemoveFirebaseToken', log, this.h_debug);
        }
    }
    
    async sendOtpCode(email: string): Promise<any> {
        const log: any = { Anonymous: true, email };
    
        try {
          const request: HttpOptions = {
            method: 'GET',
            url: this.getBE() + '/api/services/app/User/ForgotPassword/',
            headers: { 'Content-Type': 'text/plain' },
            params: { email },
          };
          log.request = request;
    
          const response = await CapacitorHttp.request(request);
          log.response = response;
          this.processResponse(response);
    
          if (response.status === 200) {
            const data = response.data;
            if (data.success && data.result != null) return data.result;
          }
    
          throw { request, response };
        } catch (e: any) {
          log.error = e;
          this.processException(e);
          throw e;
        } finally {
          appService.log('[api.service] sendOtpCode', log, this.h_debug);
        }
    }
    
    async verifyOtpCode(email: string, verificationCode: string): Promise<any> {
        const log: any = { email, verificationCode };
    
        try {
          const request: HttpOptions = {
            method: 'POST',
            url: this.getBE() + '/api/services/app/User/VerifyCode/',
            headers: { 'Content-Type': 'application/json' },
            data: {
              email: email.toString(),
              verificationCode: verificationCode.toString(),
            },
          };
          log.request = request;
    
          const response = await CapacitorHttp.request(request);
          log.response = response;
          this.processResponse(response);
    
          if (response.status === 200) {
            const data = response.data;
            if (data.success && data.result != null) return data.result;
          }
    
          throw { request, response };
        } catch (e: any) {
          log.error = e;
          this.processException(e);
          throw e;
        } finally {
          appService.log('[api.service] verifyOtpCode', log, this.h_debug);
        }
    }
    
    async resetPassword(userId: number, newPassword: string): Promise<boolean> {
        const log: any = { userId, newPassword };
    
        try {
          const request: HttpOptions = {
            method: 'POST',
            url: this.getBE() + '/api/services/app/Profile/ResetPassword_Admin',
            headers: { 'Content-Type': 'application/json' },
            data: {
              userid: userId,
              newPassword: newPassword.toString(),
            },
          };
          log.request = request;
    
          const response = await CapacitorHttp.request(request);
          log.response = response;
          this.processResponse(response);
    
          if (response.status === 200) {
            const data = response.data;
            if (data.success) return true;
          }
    
          throw { request, response };
        } catch (e: any) {
          log.error = e;
          this.processException(e);
          throw e;
        } finally {
          appService.log('[api.service] resetPassword', log, this.h_debug);
        }
    }

    async createOrUpdateUser(user: any, roles: string[]): Promise<any> {
        const log: any = { user, roles };
    
        try {
          const request: HttpOptions = {
            method: 'POST',
            url: this.getBE() + '/api/services/app/User/CreateOrUpdateUser_Admin',
            headers: { 'Content-Type': 'application/json; charset=utf-8' },
            data: {
              user: {
                userName: user.userName,
                name: user.name,
                surname: user.surname,
                emailAddress: user.emailAddress,
                phoneNumber: user.phoneNumber,
                password: user.password,
                position: 'customer',
                isActive: true,
                shouldChangePasswordOnNextLogin: false,
                isTwoFactorEnabled: false,
                isLockoutEnabled: true,
              },
              assignedRoleNames: [],
              assignedRoleCodes: roles,
              sendActivationEmail: false,
              setRandomPassword: false,
              organizationUnits: [],
            },
          };
          log.request = request;
    
          const response = await CapacitorHttp.request(request);
          log.response = response;
          this.processResponse(response);
    
          const responseData = typeof response.data === 'string'
            ? JSON.parse(response.data)
            : response.data;
    
          if (responseData.success) return responseData.result;
    
          throw { request, response };
        } catch (e: any) {
          log.error = e;
          this.processException(e);
          throw e;
        } finally {
          appService.log('[api.service] createOrUpdateUser', log, this.h_debug);
        }
    }
    
    async getCurrentUserProfile(): Promise<number> {
        const log: any = {};
    
        try {
          const request: HttpOptions = {
            method: 'GET',
            url: this.getBE() + '/api/services/app/Profile/GetCurrentUser',
            headers: { Authorization: 'Bearer ' + this.m_beToken },
          };
          log.request = request;
    
          const response = await CapacitorHttp.request(request);
          log.response = response;
          this.processResponse(response);
    
          if (response.status === 200) {
            const data = response.data;
            if (data.success && data.result?.length > 0) {
              const item = data.result[0];
              if (item?.id != null) return item.id;
            }
          }
    
          throw { request, response };
        } catch (e: any) {
          log.error = e;
          this.processException(e);
          throw e;
        } finally {
          appService.log('[api.service] getCurrentUserProfile', log, this.h_debug);
        }
    }
    
    async sendEmailDeleteAccount(email: string): Promise<void> {
        const log: any = { email };
    
        try {
          const request: HttpOptions = {
            method: 'GET',
            url: this.getBE() + '/api/services/app/User/SendMailDeleteAccount',
            headers: { 'Content-Type': 'text/plain' },
            params: { email },
          };
          log.request = request;
    
          const response = await CapacitorHttp.request(request);
    
          if (!response || response.status !== 200 || !response.data) {
            throw { request, response };
          }
    
          const data = response.data;
          if (!data.success || !data.result || !data.result.isSucceeded) {
            throw data;
          }
    
          return;
        } catch (e: any) {
          log.error = e;
          this.processException(e);
          throw e;
        } finally {
          appService.log('[api.service] sendEmailDeleteAccount', log, this.h_debug);
        }
    }
    
    async DeleteAccount(email: string, verifyCode: string): Promise<void> {
        const log: any = { email, verifyCode };
    
        try {
          const request: HttpOptions = {
            method: 'POST',
            url: this.getBE() + '/api/services/app/User/DeleteAccount',
            headers: { 'Content-Type': 'application/json;charset=utf-8' },
            data: { email, verifyCode },
          };
          log.request = request;
    
          const response = await CapacitorHttp.request(request);
          log.response = response;
          this.processResponse(response);
    
          if (!response || response.status !== 200 || !response.data) {
            throw { request, response };
          }
    
          const data = response.data;
          if (!data.success || !data.result || !data.result.isSucceeded) {
            throw data;
          }
    
          return;
        } catch (e: any) {
          log.error = e;
          this.processException(e);
          throw e;
        } finally {
          appService.log('[api.service] DeleteAccount', log, this.h_debug);
        }
    }
    
    async changePassword(oldPassword: string, newPassword: string): Promise<void> {
        const log: any = { oldPassword, newPassword };
    
        try {
          const request: HttpOptions = {
            method: 'POST',
            url: this.getBE() + '/api/services/app/Profile/ChangePassword',
            headers: {
              'Content-Type': 'application/json;charset=utf-8',
              'Authorization': 'Bearer ' + this.m_beToken,
            },
            data: { currentPassword: oldPassword, newPassword },
          };
          log.request = request;
    
          const response = await CapacitorHttp.request(request);
          log.response = response;
          this.processResponse(response);
    
          const data = response.data;
          if (data?.success) return;
    
          const error = data?.error;
          if (error?.code === 0) {
            if (error.message === 'Incorrect password.')
              throw { error: true, msg: 'Mật khẩu hiện tại không chính xác!', detail: log };
            if (error.message === 'Passwords must be at least 9 characters.')
              throw { error: true, msg: 'Mật khẩu tối thiểu 9 ký tự!', detail: log };
          }
    
          throw { error: true, msg: 'Đổi mật khẩu không thành công!', detail: { request, response } };
        } catch (e: any) {
          log.error = e;
          this.processException(e);
          throw e;
        } finally {
          appService.log('[api.service] changePassword', log, this.h_debug);
        }
    }

    //Menu
    async getAllTopMenu(): Promise<any[]> {
        const log: any = {};
    
        try {
          const request: HttpOptions = {
            method: 'GET',
            url: this.getBE() + '/api/services/app/Menus/GetAllTopMenu',
            headers: { Authorization: 'Bearer ' + this.m_beToken },
            params: {
              orgId: this.h_orgId.toString(),
              deviceType: this.h_deviceType.toString(),
            },
          };
          log.request = request;
    
          const response = await CapacitorHttp.request(request);
          log.response = response;
          this.processResponse(response);
    
          if (response.status === 200) {
            const data = response.data;
            if (data.success && Array.isArray(data.result) && data.result.length > 0) {
              return data.result;
            }
          }
    
          throw {
            error: true,
            title: 'Lỗi cấu hình',
            msg: 'Không tìm thấy Menu Top',
            detail: { request, response },
          };
        } catch (e: any) {
          log.error = e;
          this.processException(e);
          throw e;
        } finally {
          appService.log('[api.service] getAllTopMenu', log, this.h_debug);
        }
      }
    
      async getListLabel(menuId: number): Promise<any[]> {
        const log: any = { menuId };
    
        try {
          if (!menuId || menuId <= 0) return [];
    
          const request: HttpOptions = {
            method: 'GET',
            url: this.getBE() + '/api/services/app/Labels/GetListLabel',
            headers: { Authorization: 'Bearer ' + this.m_beToken },
            params: {
              menuID: menuId.toString(),
              orgId: this.h_orgId.toString(),
            },
          };
          log.request = request;
    
          const response = await CapacitorHttp.request(request);
          log.response = response;
          this.processResponse(response);
    
          if (response.status === 200) {
            const data = response.data;
            if (data.success && data.result?.parentLabel?.length > 0) {
              return data.result.parentLabel;
            }
          }
    
          return [];
        } catch (e: any) {
          log.error = e;
          this.processException(e);
          throw e;
        } finally {
          appService.log('[api.service] getListLabel', log, this.h_debug);
        }
      }
    
      async getReportId(reportCode: string): Promise<number> {
        const log: any = { reportCode };
    
        try {
          const request: HttpOptions = {
            method: 'GET',
            url: this.getBE() + '/api/services/app/DRReport/GetIdByCode',
            headers: { Authorization: 'Bearer ' + this.m_beToken },
            params: {
              code: reportCode,
              SessionSiteId: this.getSiteId().toString(),
            },
          };
          log.request = request;
    
          const response = await CapacitorHttp.request(request);
          log.response = response;
          this.processResponse(response);
    
          if (response.status === 200) {
            const data = response.data;
            if (data.success && data.result?.isSucceeded && data.result.data?.length > 0) {
              const item = data.result.data[0];
              if (item?.id != null) return item.id;
            }
          }
    
          return -1;
        } catch (e: any) {
          log.error = e;
          this.processException(e);
          throw e;
        } finally {
          appService.log('[api.service] getReportId', log, this.h_debug);
        }
      }
    
      async getReportDataSourceID(reportCode: string): Promise<number> {
        const log: any = { reportCode };
    
        try {
          const request: HttpOptions = {
            method: 'GET',
            url: this.getBE() + '/api/services/app/DRReport/GetIdByCode?code=' + reportCode,
            headers: { Authorization: 'Bearer ' + this.m_beToken },
            params: {},
          };
          log.request = request;
    
          const response = await CapacitorHttp.request(request);
          log.response = response;
          this.processResponse(response);
    
          if (response.status === 200) {
            const data = response.data;
            if (data.success && data.result?.isSucceeded && data.result.data?.length > 0) {
              const item = data.result.data[0];
              if (item?.dataSourceId != null) return item.dataSourceId;
            }
          }
    
          return -1;
        } catch (e: any) {
          log.error = e;
          this.processException(e);
          throw e;
        } finally {
          appService.log('[api.service] getReportDataSourceID', log, this.h_debug);
        }
      }
    
      async getReportData(reportId: number, reportCode: string, params?: any): Promise<any[]> {
        const log: any = { reportId, params };
    
        try {
          const isTabValue = params?.istab ? 'true' : 'false';
          if (params?.istab !== undefined) delete params.istab;
    
          params = params || {};
          params.ReportId = reportId;
          const body = this.processBody(params);
    
          const request: HttpOptions = {
            method: 'POST',
            url: this.getBE() + '/api/services/app/DRViewer/PostData',
            headers: {
              'Content-Type': 'application/json;charset=utf-8',
              Authorization: 'Bearer ' + this.m_beToken,
            },
            params: {
              id: reportId.toString(),
              SessionSiteId: this.getSiteId().toString(),
              UrlPage: reportCode,
              ispopup: 'false',
              istab: isTabValue,
            },
            data: body,
          };
          log.request = request;
    
          const response = await CapacitorHttp.request(request);
          log.response = response;
          this.processResponse(response);
    
          if (response.status === 200) {
            const data = response.data;
            if (data.success && data.result?.isSucceeded && data.result.data != null) {
              return data.result.data || [];
            }
          }
    
          throw { request, response };
        } catch (e: any) {
          log.error = e;
          this.processException(e);
        } finally {
          appService.log('[api.service] getReportData: ' + reportCode, log, this.h_debug);
        }
    
        return [];
      }
    
      async getReportDataPaging(reportId: number, reportCode: string, pageSize: number, pageNum: number, params?: any) {
        const log: any = { reportId, reportCode, pageSize, pageNum, params };
    
        try {
          params = params || {};
          params.ReportId = reportId;
          params.PageSize = pageSize;
          params.PageNumber = pageNum;
          const body = this.processBody(params);
    
          const request: HttpOptions = {
            method: 'POST',
            url: this.getBE() + '/api/services/app/DRViewer/PostDataWithDataOutput',
            headers: {
              'Content-Type': 'application/json;charset=utf-8',
              Authorization: 'Bearer ' + this.m_beToken,
            },
            params: {
              id: reportId.toString(),
              UrlPage: reportCode,
              ispopup: 'false',
              istab: 'false',
              SessionSiteId: this.getSiteId().toString(),
            },
            data: body,
          };
          log.request = request;
    
          const response = await CapacitorHttp.request(request);
          log.response = response;
          this.processResponse(response);
    
          if (response.status === 200) {
            const data = response.data;
            if (data.success && data.result?.isSucceeded && data.result.data != null) {
              return {
                rows: data.result.data,
                total: data.result.value ? parseInt(data.result.value) : null,
              };
            }
          }
    
          throw { request, response };
        } catch (e: any) {
          log.error = e;
          this.processException(e);
          throw e;
        } finally {
          appService.log('[api.service] getReportDataPaging', log, this.h_debug);
        }
      }

    async getReportFilters(reportId: number): Promise<any[]> {
        let log: any = { reportId };
        try {
          let request: HttpOptions = {
            method: 'GET',
            url: this.getBE() + '/api/services/app/DRFilter/GetFiltersByReportId',
            headers: {
              'Content-Type': 'application/json;charset=utf-8',
              'Authorization': 'Bearer ' + this.m_beToken,
            },
            params: {
              'reportId': reportId.toString(),
              'SessionSiteId': this.getSiteId().toString(),
            },
          };
          log.request = request;
          const response = await CapacitorHttp.request(request);
          log.response = response;
          this.processResponse(response);
          if (response.status == 200) {
            let data: any = response.data;
            if (data.success && data.result != null) {
              let result: any = data.result;
              if (result.isSucceeded && result.data != null)
                return result.data;
            }
          }
          throw { request, response };
        } catch (e: any) {
          log.error = e;
          this.processException(e);
          throw e;
        } finally {
          appService.log('[api.service] getReportFilters', log, this.h_debug);
        }
    }
    
    async getReportFilterData(reportId: number, filterId: number): Promise<any[]> {
        let log: any = { reportId, filterId };
        try {
          let request: HttpOptions = {
            method: 'POST',
            url: this.getBE() + '/api/services/app/DRFilter/GetFiltersByReportId',
            headers: {
              'Content-Type': 'application/json;charset=utf-8',
              'Authorization': 'Bearer ' + this.m_beToken,
            },
            params: {
              'reportId': reportId.toString(),
            },
          };
          log.request = request;
          const response = await CapacitorHttp.request(request);
          log.response = response;
          this.processResponse(response);
          if (response.status == 200) {
            let data: any = response.data;
            if (data.success && data.result != null) {
              let result: any = data.result;
              if (result.isSucceeded && result.data != null)
                return result.data;
            }
          }
          return [];
        } catch (e: any) {
          log.error = e;
          this.processException(e);
          throw e;
        } finally {
          appService.log('[api.service] getReportFilterData', log, this.h_debug);
          
        }
    }
    
    async getReportFilterDefault(reportId: number) {
        let log: any = { reportId };
        try {
          let body = { CurrentSiteId: this.getSiteId() };
          let data = this.processBody(body);
          const request: HttpOptions = {
            method: 'POST',
            url: this.getBE() + '/api/services/app/DRViewer/PostDefaultFilterData',
            headers: {
              'Content-Type': 'application/json;charset=utf-8',
              'Authorization': 'Bearer ' + this.m_beToken
            },
            params: {
              'id': reportId.toString(),
              'SessionSiteId': this.getSiteId().toString(),
            },
            data: data
          };
          log.request = request;
          const response = await CapacitorHttp.request(request);
          log.response = response;
          this.processResponse(response);
          if (response.status == 200) {
            let data: any = response.data;
            if (data.success && data.result != null) {
              let result: any = data.result;
              if (result.isSucceeded && result.data != null)
                return result.data || [];
            }
          }
          throw { error: true, msg: "Lỗi API Report Default Filter!", detail: log };
        } catch (e: any) {
          log.error = e;
          this.processException(e);
          throw e;
        } finally {
          appService.log('[api.service] getReportFilterDefault', log, this.h_debug);
        }
    }
    
    async getReportColumn(reportId: number, params?: any) {
        let log: any = {};
        try {
          let body = this.processBody(params);
          let request: HttpOptions = {
            method: 'POST',
            url: this.getBE() + '/api/services/app/DRColumn/PostByReportId',
            headers: {
              'Content-Type': 'application/json;charset=utf-8',
              'Authorization': 'Bearer ' + this.m_beToken
            },
            params: { 'reportId': reportId.toString() },
            data: body,
          };
          log.request = request;
          const response = await CapacitorHttp.request(request);
          log.response = response;
          this.processResponse(response);
        } catch (e: any) {
          log.error = e;
          this.processException(e);
          throw e;
        } finally {
          appService.log('[api.service] getReportColumn', log, this.h_debug);
          
        }
    }

    // Report Edittor
    async reportEdittorSave(reportId: number, rows: any[], form: any): Promise<any[]> {
        const log: any = { reportId, rows, form };
        try {
          for (const row of rows) {
            for (const key in row) {
              if (row[key] != null) row[key] = '' + row[key];
            }
          }
      
          const request: HttpOptions = {
            method: 'POST',
            url: this.getBE() + '/api/services/app/DRViewer/EditMultiData',
            headers: {
              'Content-Type': 'application/json;charset=utf-8',
              'Authorization': 'Bearer ' + this.m_beToken,
            },
            params: { reportId: reportId.toString() },
            data: { grid: rows, url: form },
          };
          log.request = request;
      
          const response = await CapacitorHttp.request(request);
          log.response = response;
          this.processResponse(response);
      
          const data = response.data;
          const result = data?.result;
          if (data?.success && result?.isSucceeded) {
            return result.data || [];
          }
      
          throw { request, response };
        } catch (e: any) {
          log.error = e;
          this.processException(e);
          throw e;
        } finally {
          appService.log('[api.service] reportEdittorSave', log, this.h_debug);
        }
    }
      
    async getActionButton(
        type: 'report' | 'FORMVIEWER',
        objectId: number,
        userId: number,
        labelCode?: string
      ): Promise<any[]> {
        const log: any = { type, objectId, userId, labelCode };
        try {
          const paramURL: any = {
            SessionSiteId: this.getSiteId().toString(),
            objectId: objectId.toString(),
            type,
            userId: userId.toString(),
          };
          if (labelCode != null) paramURL.labelCode = labelCode;
      
          const request: HttpOptions = {
            method: 'GET',
            url: this.getBE() + '/api/services/app/DRViewerUtility/GetActionButtonByLabelCode',
            headers: {
              'Content-Type': 'application/json;charset=utf-8',
              'Authorization': 'Bearer ' + this.m_beToken,
            },
            params: paramURL,
          };
          log.request = request;
      
          const response = await CapacitorHttp.request(request);
          log.response = response;
          this.processResponse(response);
      
          const data = response.data;
          const result = data?.result;
          if (data?.success && result?.isSucceeded) {
            return result.data || [];
          }
      
          throw { request, response };
        } catch (e: any) {
          log.error = e;
          this.processException(e);
          throw e;
        } finally {
          appService.log('[api.service] getActionButton', log, this.h_debug);
        }
    }
      
    async getFormId(formCode: string): Promise<number> {
        const log: any = { formCode };
        try {
          const request: HttpOptions = {
            method: 'GET',
            url: this.getBE() + '/api/services/app/FormViewer/GetFormIdByFormCode',
            headers: { Authorization: 'Bearer ' + this.m_beToken },
            params: { code: formCode },
          };
          log.request = request;
      
          const response = await CapacitorHttp.request(request);
          log.response = response;
          this.processResponse(response);
      
          const data = response.data;
          const result = data?.result;
          if (data?.success && result?.isSucceeded && result.data != null) {
            return result.data;
          }
      
          throw { request, response };
        } catch (e: any) {
          log.error = e;
          this.processException(e);
          throw e;
        } finally {
          appService.log('[api.service] getFormId', log, this.h_debug);
        }
    }
      
    async getFormConfig(formId: number, formCode: string) {
        const log: any = { formId, formCode };
        try {
          const request: HttpOptions = {
            method: 'POST',
            url: this.getBE() + '/api/services/app/FormViewer/FormViewerData',
            headers: {
              'Content-Type': 'application/json; charset=utf-8;',
              'Authorization': 'Bearer ' + this.m_beToken,
            },
            params: {
              form_id: formId.toString(),
              UrlPage: formCode,
              ispopup: 'false',
              istab: 'false',
            },
            data: [],
          };
          log.request = request;
      
          const response = await CapacitorHttp.request(request);
          log.response = response;
          this.processResponse(response);
      
          const data = response.data;
          const result = data?.result;
          if (data?.success && result?.isSucceeded && result.data != null) {
            return result.data;
          }
          return null;
        } catch (e: any) {
          log.error = e;
          this.processException(e);
          throw e;
        } finally {
          appService.log('[api.service] getFormConfig', log, this.h_debug);
        }
    }
      
    async getFormConfigWithParams(formId: number, formCode: string, params?: any) {
        const log: any = { formId, formCode, params };
        try {
          const body = this.processBody(params);
          const request: HttpOptions = {
            method: 'POST',
            url: this.getBE() + '/api/services/app/FormViewer/FormViewerData',
            headers: {
              'Content-Type': 'application/json; charset=utf-8;',
              'Authorization': 'Bearer ' + this.m_beToken,
            },
            params: {
              SessionSiteId: this.getSiteId().toString(),
              form_id: formId.toString(),
              UrlPage: formCode,
              ispopup: 'true',
              istab: 'false',
            },
            data: body,
          };
          log.request = request;
      
          const response = await CapacitorHttp.request(request);
          log.response = response;
          this.processResponse(response);
      
          const data = response.data;
          const result = data?.result;
          if (data?.success && result?.isSucceeded && result.data != null) {
            return result.data;
          }
          return null;
        } catch (e: any) {
          log.error = e;
          this.processException(e);
          throw e;
        } finally {
          appService.log('[api.service] getFormConfigWithParams', log, this.h_debug);
        }
    }
      
    async getFormConfigByRecord(formId: number, formCode: string, recordId: number, params?: any) {
        const log: any = { formId, formCode, recordId, params };
        try {
            const body = this.processBody(params);
          const request: HttpOptions = {
            method: 'POST',
            url: this.getBE() + '/api/services/app/FormViewer/FormViewerDataByRecord',
            headers: {
              'Content-Type': 'application/json; charset=utf-8',
              'Authorization': 'Bearer ' + this.m_beToken,
            },
            params: {
              'form_id': formId.toString(),
              'record_id': recordId.toString(),
              'UrlPage': formCode,
              'ispopup': 'false',
              'istab': 'true'
            },
            data: body
          };
          log.request = request;
          const response = await CapacitorHttp.request(request);
          log.response = response;
          this.processResponse(response);
    
          if (response.status === 200) {
            const data = response.data;
            if (data.success && data.result?.isSucceeded && data.result.data) {
              return data.result.data;
            }
          }
          return null;
        } catch (e: any) {
          log.error = e;
          this.processException(e);
          throw e;
        } finally {
          appService.log('[api.service] getFormConfigByRecord', log, this.h_debug);
        }
    }
    
    async getFormData(formId: number, recordId?: number, params?: any) {
        const log: any = { formId, recordId, params };
        try {
          const paramsURL: any = { 'form_id': formId.toString() };
          if (recordId && recordId > 0) paramsURL.record_id = recordId.toString();
          const body = this.processBody(params);
          const request: HttpOptions = {
            method: 'POST',
            url: this.getBE() + '/api/services/app/FormViewer/PostFormData',
            headers: {
              'Content-Type': 'application/json;charset=utf-8;',
              'Authorization': 'Bearer ' + this.m_beToken,
            },
            params: paramsURL,
            data: body
          };
          log.request = request;
          const response = await CapacitorHttp.request(request);
          log.response = response;
          this.processResponse(response);
    
          if (response.status === 200) {
            const data = response.data;
            if (data.success && data.result?.isSucceeded) {
              return data.result.data?.[0] || {};
            }
          }
          throw { request, response };
        } catch (e: any) {
          log.error = e;
          this.processException(e);
          throw e;
        } finally {
          appService.log('[form.service] getFormData', log, this.h_debug);
        }
    }
    
    async formInsert(formId: number, formCode: string, form: any) {
        const log: any = {};
        try {
          const request: HttpOptions = {
            method: 'POST',
            url: this.getBE() + '/api/services/app/FormViewer/FormToDatabaseInsert',
            headers: {
              'Content-Type': 'application/json;charset=utf-8',
              'Authorization': 'Bearer ' + this.m_beToken,
              'SessionSiteId': this.getSiteId().toString(),
            },
            params: {
              'form_id': formId.toString(),
              'UrlPage': formCode,
              'ispopup': 'true',
              'istab': 'false',
            },
            data: form
          };
          log.request = request;
          const response = await CapacitorHttp.request(request);
          log.response = response;
          this.processResponse(response);
    
          if (response.status === 200) {
            const data = response.data;
            if (data.success && data.result?.isSucceeded && data.result.data?.length > 0) {
              return data.result.data[0];
            }
          }
          throw { request, response };
        } catch (e: any) {
          log.error = e;
          this.processException(e);
          throw e;
        } finally {
          appService.log('[form.service] formInsert', log, this.h_debug);
        }
    }
    
    async formUpdate(formId: number, formCode: string, recordId: number, form: any) {
        const log: any = { formId, formCode, recordId, form };
        try {
          const request: HttpOptions = {
            method: 'POST',
            url: this.getBE() + '/api/services/app/FormViewer/FormToDataBaseUpdate',
            headers: {
              'Content-Type': 'application/json;charset=utf-8',
              'Authorization': 'Bearer ' + this.m_beToken,
              'SessionSiteId': this.getSiteId().toString(),
            },
            params: {
              'form_id': formId.toString(),
              'record_id': recordId.toString(),
              'UrlPage': formCode,
              'ispopup': 'true',
              'istab': 'false',
            },
            data: form
          };
          log.request = request;
          const response = await CapacitorHttp.request(request);
          log.response = response;
          this.processResponse(response);
    
          if (response.status === 200) {
            const data = response.data;
            if (data.success && data.result?.isSucceeded && data.result.data?.length > 0) {
              return data.result.data[0];
            }
          }
          throw { request, response };
        } catch (e: any) {
          log.error = e;
          this.processException(e);
          throw e;
        } finally {
          appService.log('[form.service] formUpdate', log, this.h_debug);
        }
    }

    //Service
    async getServiceConfig(serviceId: number) {
        const log: any = { serviceId };
        try {
          const request: HttpOptions = {
            method: 'GET',
            url: this.getBE() + '/api/services/app/DRReportService/GetById',
            headers: {
              'Content-Type': 'application/json;charset=utf-8',
              'Authorization': 'Bearer ' + this.m_beToken,
              'SessionSiteId': this.getSiteId().toString(),
            },
            params: { id: serviceId.toString() },
          };
          log.request = request;
      
          const response = await CapacitorHttp.request(request);
          log.response = response;
          this.processResponse(response);
      
          const data = response.data;
          if (data.success && data.result) return data.result;
          throw { request, response };
        } catch (e: any) {
          log.error = e;
          this.processException(e);
          throw e;
        } finally {
          appService.log('[form.service] getServiceConfig', log, this.h_debug);
          
        }
    }

    async getServiceData(serviceId: number, params?: any): Promise<any> {
        const log: any = { serviceId, params };
        try {
          const body = this.processBody(params);
          const request: HttpOptions = {
            method: 'POST',
            url: this.getBE() + '/api/services/app/DRReportService/HF_ExecuteServiceWithParam',
            headers: {
              'Content-Type': 'application/json;charset=utf-8',
              'Authorization': 'Bearer ' + this.m_beToken,
            },
            params: { serviceId: serviceId.toString() },
            data: body,
          };
          log.request = request;
      
          const response = await CapacitorHttp.request(request);
          log.response = response;
          this.processResponse(response);
      
          const result = response.data?.result;
          if (response.data?.success && result?.isSucceeded && result.data) return result.data;
          throw { request, response };
        } catch (e: any) {
          log.error = e;
          this.processException(e);
          throw e;
        } finally {
          appService.log('[form.service] getServiceData', log, this.h_debug);
        }
    }

    async getServiceDataByCode(serviceCode: string, params?: any): Promise<any> {
        const log: any = { serviceCode, params };
        try {
          const body = this.processBody(params);
          const request: HttpOptions = {
            method: 'POST',
            url: this.getBE() + '/api/services/app/DRReportService/ExecuteServiceByCodeWithParam',
            headers: {
              'Content-Type': 'application/json;charset=utf-8',
              'Authorization': 'Bearer ' + this.m_beToken,
            },
            params: { code: serviceCode },
            data: body,
          };
          log.request = request;
      
          const response = await CapacitorHttp.request(request);
          log.response = response;
          this.processResponse(response);
      
          const result = response.data?.result;
          if (response.data?.success && result?.isSucceeded && result.data) return result.data;
          throw { request, response };
        } catch (e: any) {
          log.error = e;
          this.processException(e);
          throw e;
        } finally {
          appService.log('[form.service] getServiceDataByCode' + serviceCode , log, this.h_debug);
        }
    }
      
    async runAction(recordId: number | number[], storeName: string, actionId: number, params?: any, dataSourceId?: number): Promise<any> {
        const log: any = { recordId, storeName, actionId, params };
        try {
          const isList = typeof recordId !== 'number';
          if (!dataSourceId) dataSourceId = this.getDataSource();
      
          if (isList) params.ListId = (recordId as number[]).join(',');
          const body = this.processBody(params);
      
          const paramUrl: any = {
            StoreName: storeName,
            dataSrcId: dataSourceId.toString(),
            labelactionId: actionId.toString(),
          };
          if (!isList) paramUrl.Id = (recordId as number).toString();
      
          const request: HttpOptions = {
            method: 'POST',
            url: this.getBE() + '/api/services/app/DRViewerUtility/' + (isList ? 'ActionWithListParamId' : 'ActionWithParamId'),
            headers: {
              'Content-Type': 'application/json;charset=utf-8',
              'Authorization': 'Bearer ' + this.m_beToken,
              'SessionSiteId': this.getSiteId().toString(),
            },
            params: paramUrl,
            data: body,
          };
          log.request = request;
      
          const response = await CapacitorHttp.request(request);
          log.response = response;
          this.processResponse(response);
      
          const result = response.data?.result;
          if (response.data?.success && result?.isSucceeded) return result.data;
          throw { request, response };
        } catch (e: any) {
          log.error = e;
          this.processException(e);
          throw e;
        } finally {
          appService.log('[form.service] runAction' , log, this.h_debug);
        }
    }

    async runActionOutput(recordId: number, storeName: string, actionId: number, params?: any, dataSourceId?: number): Promise<any> {
        const log: any = {};
        try {
          if (!dataSourceId) dataSourceId = this.getDataSource();
      
          const body = this.processBody(params);
          const request: HttpOptions = {
            method: 'POST',
            url: this.getBE() + '/api/services/app/DRViewerUtility/ActionWithParamIdAndReturnOutput',
            headers: {
              'Content-Type': 'application/json;charset=utf-8',
              'Authorization': 'Bearer ' + this.m_beToken,
            },
            params: {
              Id: recordId.toString(),
              StoreName: storeName,
              dataSrcId: dataSourceId.toString(),
              labelactionId: actionId.toString(),
            },
            data: body,
          };
          log.request = request;
      
          const response = await CapacitorHttp.request(request);
          log.response = response;
          this.processResponse(response);
      
          const result = response.data?.result;
          if (response.data?.success && result?.isSucceeded) return result;
          if (result?.message) throw { error: true, msg: result.message };
          throw { request, response };
        } catch (e: any) {
          log.error = e;
          this.processException(e);
          throw e;
        } finally {
          appService.log('[form.service] runActionOutput' , log, this.h_debug);
        }
    }

    async executeStore(storeName: string, params?: any, dataSourceId?: number): Promise<any[]> {
        const log: any = { storeName, params };
        try {
          if (!dataSourceId) dataSourceId = this.getDataSource();
          const body = this.processBody(params);
      
          const request: HttpOptions = {
            method: 'POST',
            url: this.getBE() + '/api/services/app/DRViewer/ExecuteStoreWithParamAndDatasource',
            headers: {
              'Content-Type': 'application/json;charset=utf-8',
              'Authorization': 'Bearer ' + this.m_beToken,
            },
            params: {
              dataSourceId: dataSourceId.toString(),
              store: storeName,
            },
            data: body,
          };
          log.request = request;
      
          const response = await CapacitorHttp.request(request);
          log.response = response;
          this.processResponse(response);
      
          return response.data?.success ? response.data?.result || [] : [];
        } catch (e: any) {
          log.error = e;
          this.processException(e);
        } finally {
          appService.log('[form.service] executeStore -' + storeName , log, this.h_debug);
        }
        return [];
    }
    
    async executeStoreOutput(storeName: string, params?: any, dataSourceId?: number): Promise<any> {
        const log: any = { storeName, params };
        try {
          if (!dataSourceId) {
            dataSourceId = this.getDataSource();
          }
          log.dataSourceId = dataSourceId;

          const urlParams: any = {
            StoreName: storeName,
            dataSrcId: dataSourceId.toString(),
          };
      
          if (params?.Id != null) {
            urlParams.Id = params.Id.toString();
          }
          if (params?.userId != null) {
            urlParams.userId = params.userId.toString();
          }
          if (params?.labelactionId != null) {
            urlParams.labelactionId = params.labelactionId.toString();
          }

          const body = this.processBody(params);
          log.body = body;

          const request: HttpOptions = {
            method: 'POST',
            url: this.getBE() + '/api/services/app/DRViewerUtility/ActionWithParamIdAndReturnOutput',
            headers: {
              'Content-Type': 'application/json; charset=utf-8;',
              'Authorization': 'Bearer ' + this.m_beToken,
            },
            params: urlParams,
            data: body,
          };
          log.request = request;
    
          const response = await CapacitorHttp.request(request);
          log.response = response;
          this.processResponse(response);
    
          const data = response.data;
          if (response.status === 200 && data?.success) {
            return data.result;
          }
      
          throw { error: true, request, response };
        } catch (e: any) {
          log.error = e;
          this.processException(e);
        } finally {
          appService.log('[form.service] executeStoreOutput -' + storeName , log, this.h_debug);
        }
        return [];
    }

    // Attachment
    async uploadAttachment(code: string, lstFile: File[], opts: any = {}): Promise<any> {
        const log: any = { code, opts };
        try {
          log.fileNames = lstFile.map(v => ({ name: v.name, type: v.type, size: v.size }));
          const formData = new FormData();
          for (const file of lstFile) {
            formData.append('files', file, file.name);
          }
    
          const paramsURL = new URLSearchParams();
          paramsURL.set('code', code);
          if (opts.addWatermark === true) paramsURL.set('isProtect', 'true');
    
          const response = await fetch(this.getFS() + '/api/v1/Attachment/upload?' + paramsURL.toString(), {
            method: 'POST',
            body: formData,
          });
    
          const resJson = await response.json();
          log.response = response;
          log.resJson = resJson;
    
          if (response.status === 200 && resJson?.result?.isSucceeded) {
            return resJson.result.data;
          }
    
          throw { error: true, msg: resJson?.result?.message || 'Lỗi tải lên file!', detail: { ...log } };
        } catch (e: any) {
          log.error = e;
          this.processException(e);
          throw e;
        } finally {
          appService.log('[form.service] uploadAttachment' , log, this.h_debug);
        }
    }
    
    async updateAttachment(attachmentIds: number[], objectId: number) {
        const log: any = { attachmentIds, objectId };
        try {
          const request: HttpOptions = {
            method: 'POST',
            url: this.getFS() + '/api/v1/Attachment/update/objectid',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ' + this.m_beToken,
            },
            params: { objectId: objectId.toString() },
            data: attachmentIds,
          };
    
          log.request = request;
          const response = await CapacitorHttp.request(request);
          log.response = response;
          this.processResponse(response);
    
          if (response.status === 200 && response.data?.result?.isSucceeded) return;
    
          throw { request, response };
        } catch (e: any) {
          log.error = e;
          this.processException(e);
          throw e;
        } finally {
          appService.log('[form.service] updateAttachment' , log, this.h_debug);
        }
    }
    
    async getAttachment(code: string, objectId: number): Promise<any[]> {
        const log: any = { code, objectId };
        try {
          const request: HttpOptions = {
            method: 'GET',
            url: this.getFS() + '/api/v1/Attachment/get/uploadfile/objectid',
            headers: { 'Authorization': 'Bearer ' + this.m_beToken },
            params: { objectId: objectId.toString(), code },
          };
    
          log.request = request;
          const response = await CapacitorHttp.request(request);
          log.response = response;
          this.processResponse(response);
    
          const result = response.data?.result;
          if (response.status === 200 && result?.isSucceeded) {
            return result.data || [];
          }
    
          throw { request, response };
        } catch (e: any) {
          log.error = e;
          this.processException(e);
          throw e;
        } finally {
          appService.log('[form.service] getAttachment -' + code , log, this.h_debug);
        }
    }
    
    async deleteAttachment(attachmentIds: number[]) {
        const log: any = { attachmentIds };
        try {
          const request: HttpOptions = {
            method: 'POST',
            url: this.getFS() + '/api/v1/Attachment/delete',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ' + this.m_beToken,
            },
            data: attachmentIds,
          };
    
          log.request = request;
          const response = await CapacitorHttp.request(request);
          log.response = response;
          this.processResponse(response);
    
          const result = response.data?.result;
          if (response.status === 200 && result?.isSucceeded) return;
    
          throw { request, response };
        } catch (e: any) {
          log.error = e;
          this.processException(e);
          throw e;
        } finally {
          appService.log('[form.service] deleteAttachment' , log, this.h_debug);
          
        }
    }
    
    async deleteAttachmentByName(objectType: string, objectId: number, fileName: string): Promise<boolean> {
        const log: any = {};
        try {
          const request: HttpOptions = {
            method: 'POST',
            url: this.getFS() + '/api/v1/Attachment/deleteObjectId',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ' + this.m_beToken,
            },
            params: {
              objectType,
              objectId: objectId.toString(),
              FileName: fileName,
            },
          };
    
          log.request = request;
          const response = await CapacitorHttp.request(request);
          log.response = response;
          this.processResponse(response);
    
          return response.status === 200 && response.data?.result?.isSucceeded;
        } catch (e: any) {
          log.error = e;
          this.processException(e);
          throw e;
        } finally {
          appService.log('[form.service] deleteAttachmentByName' , log, this.h_debug);
        }
      }
    
      downloadAttachment(url: string, callback: (state: number, progress: number, message?: string, response?: any) => void) {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'blob';
    
        xhr.addEventListener('progress', (event: ProgressEvent) => {
          if (event.lengthComputable) {
            callback(0, event.loaded / event.total);
          }
        });
    
        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            callback(1, 1.0, '', xhr.response);
          } else {
            callback(2, 0.0, xhr.statusText);
          }
        });
    
        xhr.addEventListener('error', () => callback(2, 0.0));
        xhr.send();
    }
    
    async downloadAttachmentAsync(url: string, callback?: (percent: number) => void): Promise<any> {
        const log: any = { url };
        try {
          return await new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('GET', url, true);
            xhr.responseType = 'blob';
    
            if (callback) {
              xhr.addEventListener('progress', (event: ProgressEvent) => {
                if (event.lengthComputable) {
                  callback(event.loaded / event.total);
                }
              });
            }
    
            xhr.addEventListener('load', () => {
              xhr.status === 200 ? resolve(xhr.response) : reject(xhr.statusText);
            });
    
            xhr.addEventListener('error', (event: ProgressEvent) => reject(event));
            xhr.send();
          });
        } catch (e: any) {
          log.error = e;
          if (typeof e === 'string' && e === 'Not Found') {
            throw { error: true, msg: 'Không tìm thấy file trên máy chủ!' };
          }
          throw e;
        } finally {
          appService.log('[form.service] downloadAttachmentAsync' , log, this.h_debug);
        }
    }

    // Account
    async sendEmailActivationLink(email: string) {
        const log: any = { email };
        try {
          const request: HttpOptions = {
            method: 'POST',
            url: this.getBE() + '/api/services/app/Account/SendEmailActivationLink',
            headers: {
              Authorization: 'Bearer ' + this.m_beToken,
            },
            params: {
              emailAdress: email.toString(),
            },
          };
          log.request = request;
      
          const response = await CapacitorHttp.request(request);
          log.response = response;
          this.processResponse(response);
      
          const data = response.data;
          const result = data?.result;
          if (data?.success && result?.isSucceeded && result.data != null) {
            return result.data;
          }
      
          throw { request, response };
        } catch (e: any) {
          log.error = e;
          this.processException(e);
          throw e;
        } finally {
          appService.log('[api.service] sendEmailActivationLink', log, this.h_debug);
        }
    }

    // Notification
    async getNotifications(userId: number, notificationType: number): Promise<any> {
        const log: any = { userId, notificationType };
        try {
          const request: HttpOptions = {
            method: 'GET',
            url: this.getBE() + '/api/services/app/Notification_Data/getNotificationDatasById',
            headers: {
              'Content-Type': 'application/json; charset=utf-8',
              Authorization: 'Bearer ' + this.m_beToken,
            },
            params: {
              userId: userId.toString(),
              notificationType: notificationType.toString(),
            },
          };
          log.request = request;
      
          const response = await CapacitorHttp.request(request);
          log.response = response;
          this.processResponse(response);
      
          const data = response.data;
          const result = data?.result;
          if (data?.success && result?.isSucceeded) {
            return data;
          }
      
          throw { request, response };
        } catch (e: any) {
          log.error = e;
          this.processException(e);
          throw e;
        } finally {
          appService.log('[api.service] getNotifications', log, this.h_debug);
        }
    }

    async deleteNotification(notificationId: number): Promise<any> {
        const log: any = { notificationId };
        try {
          const request: HttpOptions = {
            method: 'POST',
            url: this.getBE() + '/api/services/app/Notification_Data/setStatusNotification',
            headers: {
              'Content-Type': 'application/json; charset=utf-8',
              Authorization: 'Bearer ' + this.m_beToken,
            },
            params: {
              notificationId: notificationId.toString(),
            },
          };
          log.request = request;
      
          const response = await CapacitorHttp.request(request);
          log.response = response;
          this.processResponse(response);
      
          const data = response.data;
          const result = data?.result;
          if (data?.success && result?.isSucceeded) {
            return data;
          }
      
          throw { request, response };
        } catch (e: any) {
          log.error = e;
          this.processException(e);
          throw e;
        } finally {
          appService.log('[api.service] deleteNotification', log, this.h_debug);
        }
    }

    // Digital Sign
    public async signature_MySignViettel(attId: number, attSyntax: string, objectId: number
        , signUserId: string, signReason: string, signLocation: string, signImage: string, signInfo: string
        , coorX: number, coorY: number, width: number, height: number, pageNum: number
        , description: string, dateFormat: string = '', postName: string = ''
      ): Promise<any> {
        let log: any = { attId, attSyntax, objectId };
        try {
    
          // Process Body
          let body = this.processBody({
            attId: attId, attSyntax: attSyntax, objectId: objectId,
            signUserId: signUserId, signReason: signReason, signLocation: signLocation, signImage: signImage, signInfo: signInfo,
            coorX: coorX, coorY: coorY, width: width, height: height, pageNum: pageNum,
            description: description, dateFormat: dateFormat, postName: postName, fsToken: this.m_fsToken,
          });
    
          // Request
          let request: HttpOptions = {
            method: 'POST',
            // url: 'http://localhost:22743/api/services/app/DigitalSign/MySignViettel_SignPDF', // #TODO
            url: this.getBE() + '/api/services/app/DigitalSign/MySignViettel_SignPDF',
            headers: {
              'Content-Type': 'application/json; charset=utf-8 ',
              'Authorization': 'Bearer ' + this.m_beToken
            },
            data: body
          };
          log.request = request;
    
          // Call API
          const response = await CapacitorHttp.request(request);
          log.response = response;
          this.processResponse(response);
    
          // Return
          if (response.status == 200) {
            let data: any = response.data;
            if (data.success) {
              let result: any = data.result;
              if (result && result.isSucceeded)
                return result.data; // Return Attachment Id Signed
            }
          }
          throw { request, response };
        }
        catch (e: any) {
          log.error = e;
          this.processException(e);
          throw e;
        }
        finally {
          appService.log('[api.service] signature_MySignViettel', log, this.h_debug);
        }
    }

    // === THIRD PARTY SERVICE ===
    async aws_compareFace(file1: File, file2: File): Promise<any> {
        let log: any = { file1, file2 };
        try {
    
          // Tạo FormData
          const formData: FormData = new FormData();
          formData.append('files', file1, file1.name);
          formData.append('files', file2, file2.name);
          log.formData_getAll_files = formData.getAll('files');
    
          // Call API
          const response: Response = await fetch(
            this.getBE() + '/api/services/app/Amazon/CompareFace'
            // 'http://192.168.1.60:22743/api/services/app/Amazon/CompareFace' // FE -> BE
            // 'http://192.168.1.60:22743/api/services/app/Amazon/CompareFace' // Mobile -> BE
            ,{
              method: 'POST',
              headers: {
                'Accept': 'application/json',
                'Authorization': 'Bearer ' + this.m_beToken,
              },
              body: formData,
            }
          );
    
          // Process Response
          let data = await response.json();
          if (data != null && data.success) {
            let result = data.result;
            if (result != null && result.isSucceeded) {
              if (result.isSucceeded)
                return result.data; // Response of Amazon Service
            }
          }
          throw { response};
        }
        catch (e: any) {
          log.error = e;
          this.processException(e);
          throw e;
        }
        finally {
          appService.log('[api.service] aws_compareFace', log, this.h_debug);
        }
      }
      async zoom_CreateMeet(email: string, name: string, password: string, duration: number, topic: string) { // Tạo cuộc họp Zoom Meet
        let log: any = { email, name, password, duration, topic };
        try {
    
          // Prepare body
          let body = this.processBody({
            email: email, // Mail chủ
            name: name, // Tên cuộc họp
            password: password, // Đặt mật khẩu
            duration: duration, // Thời lượng
            topic: topic, // Chủ đề
          });
    
          // Request
          let request: HttpOptions = {
            method: 'POST',
            url: 'http://localhost:22743/api/services/app/Zoom/CreateMeet', // #TODO
            // url: this.getBE() + '/api/services/app/Zoom/CreateMeet',
            headers: {
              'Content-Type': 'application/json; charset=utf-8 ',
              'Authorization': 'Bearer ' + this.m_beToken
            },
            data: body
          };
          log.request = request;
    
          // Call API
          const response = await CapacitorHttp.request(request);
          log.response = response;
          this.processResponse(response);
    
          // Return
          if (response.status == 200) {
            let data: any = response.data;
            if (data.success) {
              let result: any = data.result;
              if (result && result.isSucceeded)
                return result.data; // Return Attachment Id Signed
            }
          }
          throw { request, response };
        }
        catch (e: any) {
          log.error = e;
          this.processException(e);
          throw e;
        }
        finally {
          appService.log('[api.service] zoom_CreateMeet', log, this.h_debug);
        }
      }       
    
    // Utils
    private processBody(body: any): any[] {
        const data = [];
        if (body != null) {
          for (const prop in body) {
            const data: { Varible: string, Value: any }[]=[];
          }
        }
        return data;
    }
      
    private processResponse(response: any) {
        if (response.status === 401)
          throw { error: true, process: 'OVER_SESSION' };
        else if (response.status === 502)
          throw { error: true, process: 'BAD_GATEWAY' };
      
        const isSucceeded: boolean = response.data?.result?.isSucceeded || false;
        if (!isSucceeded) {
          const message: string = response.data?.result?.message || '';
          if (message.length > 0)
            throw {
              error: true,
              msg: 'Máy chủ: ' + message,
              detail: configService.DEBUG ? response : null,
            };
        }
    }
      
    private processException(exception: any) {
        if (exception instanceof TypeError) {
          if (exception.message === 'Failed to fetch')
            throw { error: true, msgCode: 'exception.server_not_responding' };
          throw { error: true, msg: exception.message };
        }
      
        throw exception;
    }

    // Đại hội Đảng
    async dhd_login(username: string, password: string, rememberme: boolean): Promise<boolean> {
        let log: any = { username, password, rememberme };
        try {
    
          // Prepare body
          const body = new URLSearchParams();
          body.append('UserName', username);
          body.append('Password', password);
          body.append('RememberMe', String(rememberme));
    
          // Prepare Request
          let request: HttpOptions = {
            method: 'POST',
            url: this.getBE() + '/API/Login',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            data: body.toString()
          };
          log.request = request;
    
          // Call API
          const response = await CapacitorHttp.request(request);
          log.response = response;
          this.processResponse(response);
    
          // Return
          if (response.status == 200)
            return response.data;
    
          throw { request, response };
        }
        catch (e: any) {
          log.error = e;
          this.processException(e);
          throw e;
        }
        finally {
            appService.log('[api.service] dhd_login', log, this.h_debug);
        }
      }

    public async dhd_logout() {
        let log: any = {};
        try {
    
          // Prepare Request
          let request: HttpOptions = {
            method: 'POST',
            url: this.getBE() + '/API/Login',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          };
          log.request = request;
    
          // Call API
          const response = await CapacitorHttp.request(request);
          log.response = response;
          this.processResponse(response);
    
          // Return
          if (response.status == 200) {
            let data: any = response.data;
            return data.isSucceeded;
          }
          throw { request, response };
        }
        catch (e: any) {
          log.error = e;
          this.processException(e);
          throw e;
        }
        finally {
            appService.log('[api.service] dhd_login', log, this.h_debug);
        }
    }

      public async callStore(store: string, params: any) {
        let log: any = { store, params };
        try {
    
          if (params == null)
            params = '';
    
          // Prepare Request
          let request: HttpOptions = {
            method: 'POST',
            url: this.getBE() + '/API/CallStore',
            headers: { 'Content-Type': 'application/json' },
            params: { 'store': store },
            data: params
          };
          log.request = request;
    
          // Call API
          const response = await CapacitorHttp.request(request);
          log.response = response;
    
          // Return
          if (response.status == 200) {
            let data: any = response.data;
            if (data.isSucceeded)
              return data.data;
            else
              throw { error: true, msg: data.message };
          }
    
          // Other Exception
          throw { request, response };
        }
        catch (e: any) {
          log.error = e;
          this.processException(e);
          throw e;
        }
        finally {
            appService.log('[api.service] callStore', log, this.h_debug);
        }
    }
}

export const apiService = new ApiService();

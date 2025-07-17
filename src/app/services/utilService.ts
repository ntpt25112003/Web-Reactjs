import moment from 'moment';
import CryptoJS from 'crypto-js';
import DOMPurify from 'dompurify';
import configService from './configService'; 

class UtilService {

  // Const
  private readonly h_debug = false;

  // Format strings
  public readonly H_FM_DATETIME_ISO = 'YYYY-MM-DDTHH:mm:ss';
  public readonly H_FM_DATE = 'DD/MM/YYYY';
  public readonly H_FM_DATE_ISO = 'YYYY-MM-DD';
  public readonly H_FM_DATETIME = 'DD/MM/YYYY HH:mm:ss';
  public readonly H_FM_DATETIME2 = 'DD/MM/YYYY HH:mm';
  public readonly H_FM_DATETIME_NAME = 'YYYYMMDDHHmmss';
  public readonly H_FM_DATETIME_NAME2 = 'YYYYMMDD';
  public readonly H_FM_TIME = 'HH:mm';
  public readonly H_FM_TIME2 = 'HH:mm:ss';

  // Number formatter
  private readonly l_currencyFormater = new Intl.NumberFormat('vi-VN', {
    style: 'currency', currency: 'VND'
  });

  constructor(
    private config: typeof configService,
  ) {}

  // Ví dụ một số method chuyển đổi

  getNameServiceByFieldCode(formPack: any, fieldCode: string, value: any): string {
    if (value == null) return '';

    const formField = formPack.formFields.find((e: any) => e.code === fieldCode);
    if (!formField) return '';

    const formFieldOption = JSON.parse(formField.options);
    const serviceId = formFieldOption.editorOptions.service;

    const service = formPack.services.find((e: any) => e.serviceId === serviceId);
    if (!service) return '';

    const dataService = service.dataSource.find((e: any) => e[service.valueExpr] === value);
    if (!dataService) return '';

    return dataService[service.displayExpr];
  }

  getValueFromActionOption(option: string, key: string): string {
    const lstParams = option.split(", ");
    for (const pair of lstParams) {
      if (pair.startsWith(key + ":")) {
        return pair.substring(key.length + 1);
      }
    }
    return "";
  }

  formatDate(value: string, format: string = this.H_FM_DATE): string {
    if (value && value.length > 0) return moment(value).format(format);
    return value;
  }

  reformatDate(value: string): string {
    if (!value || value.length === 0) return '';
    return moment(value, this.H_FM_DATE).format(this.H_FM_DATETIME_ISO);
  }

  formatTime(value: number): string {
    if (value <= 0) return '00:00';
    const minutes = Math.floor(value / 60);
    const seconds = value % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  formatCurrency(value: number): string | number {
    if (value != null) return this.l_currencyFormater.format(value);
    return value;
  }

  formatNumber(value: any): string {
    if (value == null) return '';

    let num = typeof value === 'number' ? value.toString() : value;
    if (num.length === 0) return '';

    if (num[0] === '0' && num.length > 1) num = num.substring(1);
    num = num.replace(/[^0-9]*/g, '');

    let res = "";
    let trip = num.length % 3;
    for (let i = 0; i < num.length; i++) {
      if (trip === 0) {
        trip = 3;
        if (i > 0) res += '.';
      }
      res += num[i];
      trip--;
    }
    return res;
  }

  reformatNumber(value: string | null): number {
    if (value == null) return 0;
    value = value.replace(/\./g, "");
    let n = parseInt(value);
    if (isNaN(n)) n = 0;
    return n;
  }

  formatDecimal(value: any): string {
    if (value == null) return '';

    let num = '';
    if (typeof value === 'number') num = value.toString().replace(/\./g, ',');
    else num = value.replace(/[^0-9,]*/g, '');

    if (num.length === 0) return '';

    const pos = num.indexOf(',');
    const pos2 = num.lastIndexOf(',');

    if (pos !== pos2) num = num.substring(0, pos2) + num.substring(pos2 + 1);

    let natural_part = '', decimal_part = '';
    if (pos === -1) natural_part = num;
    else {
      natural_part = num.substring(0, pos);
      decimal_part = num.substring(pos + 1);
    }

    if (pos > -1 && natural_part.length === 0) natural_part = '0';
    else if (natural_part[0] === '0' && natural_part.length > 1) natural_part = natural_part.substring(1);

    let res = '';
    let trip = natural_part.length % 3;
    for (let i = 0; i < natural_part.length; i++) {
      if (trip === 0) {
        trip = 3;
        if (i > 0) res += '.';
      }
      res += natural_part[i];
      trip--;
    }

    if (decimal_part.length > 0) {
      res += ',';
      trip = 0;
      for (let i = 0; i < decimal_part.length; i++) {
        if (trip === 3) {
          trip = 0;
          res += '.';
        }
        res += decimal_part[i];
        trip++;
      }
    } else if (pos > -1) res += ',';

    return res;
  }

  reformatDecimal(value: string | null): number {
    if (value == null) return 0;
    value = value.replace(/\./g, '');
    value = value.replace(/\,/g, '.');
    let n = parseFloat(value);
    if (isNaN(n)) n = 0;
    return n;
  }

  formatPhoneNumber(value: string): string {
    if (value.length === 0) return '';
    return value.replace(/[^0-9]*/g, '');
  }

  unicode2assci(str: string): string {
    if (str.length === 0) return '';

    // Replace Vietnamese characters with ASCII equivalents
    str = str.replace(/A|Á|À|Ã|Ạ|Â|Ấ|Ầ|Ẫ|Ậ|Ă|Ắ|Ằ|Ẵ|Ặ/g, "A");
    str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
    str = str.replace(/E|É|È|Ẽ|Ẹ|Ê|Ế|Ề|Ễ|Ệ/g, "E");
    str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
    str = str.replace(/I|Í|Ì|Ĩ|Ị/g, "I");
    str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
    str = str.replace(/O|Ó|Ò|Õ|Ọ|Ô|Ố|Ồ|Ỗ|Ộ|Ơ|Ớ|Ờ|Ỡ|Ợ/g, "O");
    str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
    str = str.replace(/U|Ú|Ù|Ũ|Ụ|Ư|Ứ|Ừ|Ữ|Ự/g, "U");
    str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
    str = str.replace(/Y|Ý|Ỳ|Ỹ|Ỵ/g, "Y");
    str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
    str = str.replace(/Đ/g, "D");
    str = str.replace(/đ/g, "d");

    str = str.replace(/\u0300|\u0301|\u0303|\u0309|\u0323/g, ""); // Huyền sắc hỏi ngã nặng
    str = str.replace(/\u02C6|\u0306|\u031B/g, ""); // Â, Ê, Ă, Ơ, Ư
    return str;
  }

  coverEmail(email: string): string {
    const pos = email.indexOf('@');
    if (pos === -1) throw new Error('exception.email_invail_format');

    const name = email.substring(0, pos);
    let cover = '';
    if (name.length > 6) {
      cover = name[0] + name[1];
      for (let i = 2; i < name.length - 3; i++) cover += '*';
      cover += name[name.length - 3] + name[name.length - 2] + name[name.length - 1];
    } else {
      for (let i = 0; i < name.length; i++) cover += '*';
    }
    cover += email.substring(pos);
    return cover;
  }

  safeHTML(html: string): string {
    // Thay thế DomSanitizer bằng DOMPurify
    return DOMPurify.sanitize(html);
  }

  htmlSkip(html: string): string {
    return html.replace(/<[^>]*>/g, '');
  }

  sysdate(format: string = this.H_FM_DATETIME_ISO): string {
    return moment().format(format);
  }

  deltaDate(date: string, unit: string, delta: number): string {
    if (delta === 0) return date;

    let dateM = moment(date);

    let shortUnit: moment.unitOfTime.Base = 'd';
    switch (unit) {
      case 'day': shortUnit = 'd'; break;
      case 'month': shortUnit = 'M'; break;
      case 'year': shortUnit = 'y'; break;
      case 'hour': shortUnit = 'h'; break;
      case 'minutes': shortUnit = 'm'; break;
      case 'seconds': shortUnit = 's'; break;
      default: throw new Error('exception.date_unit_code_invail');
    }

    if (delta > 0) dateM = dateM.add(delta, shortUnit);
    else dateM = dateM.subtract(-delta, shortUnit);

    return dateM.format(this.H_FM_DATETIME_ISO);
  }

  compareDate(lhs: string, rhs: string, withoutTime = false): number {
    let date1 = moment(lhs);
    let date2 = moment(rhs);
    if (withoutTime) {
      date1 = date1.startOf('day');
      date2 = date2.startOf('day');
    }
    return date1.diff(date2);
  }

  compareTime_Minute(lhs: string, rhs: string): number {
    let date1 = moment(lhs);
    let date2 = moment(rhs);
    return date2.diff(date1, 'minutes');
  }

  timestamp_to_DateISOStr(timestamp: number, format: string = this.H_FM_DATETIME_ISO): string {
    return moment(new Date(timestamp)).format(format);
  }

  dateStr_to_Timestamp(dateISOStr: string): number {
    return moment(dateISOStr).toDate().getTime();
  }

  formatTimeShort(seconds: number): string {
    let minute: any = Math.floor(seconds / 60);
    let second: any = Math.floor(seconds) % 60;
    if (minute < 10) minute = '0' + minute;
    if (second < 10) second = '0' + second;
    return minute + ':' + second;
  }

  getRangeDateInWeek(date: string): string {
    let d = new Date(date);
    let day = d.getDay();

    let monday = new Date(d);
    monday.setDate(d.getDate() - day + (day === 0 ? -6 : 1));

    let sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    let format = this.H_FM_DATE;
    return moment(monday).format(format) + ' - ' + moment(sunday).format(format);
  }

  buildTree(list: any[], propKey: string, propParent: string, propChild: string, opts?: any): any[] {
    if (!opts) opts = {};

    const map: any = {};
    for (const node of list) map[node[propKey]] = node;

    const setFilterId = new Set();
    if (opts.filter && opts.filter.length > 0) {
      for (const nodeKey of opts.filter) {
        setFilterId.add(nodeKey);
        const node = map[nodeKey];
        const parentId = node[propParent];
        if (parentId) setFilterId.add(parentId);
      }
    }

    const tree: any[] = [];
    for (const node of list) {
      if (opts.filter && !setFilterId.has(node[propKey])) continue;

      if (opts.fillChildrenEmpty && node[propChild] == null) node[propChild] = [];

      if (opts.assignObject) Object.assign(node, opts.assignObject);

      if (node[propParent] != null) {
        const parentNode = map[node[propParent]];
        if (parentNode != null) {
          if (parentNode[propChild] == null) parentNode[propChild] = [];
          parentNode[propChild].push(node);
        }
      } else {
        tree.push(node);
      }
    }
    return tree;
  }

  calcDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000;

    const toRadians = (angle: number): number => angle * (Math.PI / 180);
    const phi1 = toRadians(lat1);
    const phi2 = toRadians(lat2);
    const deltaPhi = toRadians(lat2 - lat1);
    const deltaLamda = toRadians(lng2 - lng1);

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLamda / 2) * Math.sin(deltaLamda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  randColor(): string {
    return '#' + Math.floor(Math.random() * 16777215).toString(16);
  }

  encrypt(val: string): string {
    return CryptoJS.AES.encrypt(val, this.config.randStr).toString();
  }

  decrypt(valEncrypted: string): string {
    return CryptoJS.AES.decrypt(valEncrypted, this.config.randStr).toString(CryptoJS.enc.Utf8);
  }

  getRandomNum(min: number, max: number): number {
    return Math.floor(Math.random() * max + min);
  }
}

const utilService = new UtilService(configService);
export default utilService;

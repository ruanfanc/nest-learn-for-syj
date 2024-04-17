export const CASE_TYPE_MAP = {
  1: '家庭婚姻',
  2: '借款借贷',
  3: '劳动工伤',
  4: '合同纠纷',
  5: '交通事故',
  6: '土地纠纷',
  7: '房产纠纷',
  8: '经济纠纷',
  9: '消费权益',
  10: '其它纠纷',
};

export type CASE_TYPE_MAP_VALUE = (keyof typeof CASE_TYPE_MAP)[];

export const enum CASE_STATUS {
  NOCASE = 0,
  WAITTING = 1,
  PROCESSING = 2,
  COMPELETE = 3,
  DRAFT = 4,
  WAIT_FOR_AUDIT = 5,
}

export const CASE_STATUS_MAP: { [key in CASE_STATUS]: string } = {
  0: '正常',
  1: '待受理',
  2: '受理中',
  3: '已完成 ',
  4: '草稿',
  5: '待审核',
};

export const CASES_BUTTONS_MAP = {
  1: '编辑',
  2: '详谈',
  3: '重新委托',
  4: '取消案件',
  5: '受理案件',
};

export type CASES_BUTTONS_MAP_Value = (keyof typeof CASES_BUTTONS_MAP)[];

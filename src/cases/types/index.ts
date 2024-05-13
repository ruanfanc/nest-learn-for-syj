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
  //代受理
  WAITTING = 1,
  //受理中
  PROCESSING = 2,
  //已完成
  COMPELETE = 3,
  //草稿
  DRAFT = 4,
  //待审核
  WAIT_FOR_AUDIT = 5,
  // 帖子审核通过
  POST_AUDITED = 6,
  NOT_AUDITED = 7,
  DELETED = 8,
}

export const CASE_STATUS_MAP: { [key in CASE_STATUS]: string } = {
  1: '待受理',
  2: '受理中',
  3: '已完成 ',
  4: '草稿',
  5: '待审核',
  6: '帖子审核通过',
  7: '审核打回',
  8: '已删除',
};

export const CASES_BUTTONS_MAP = {
  1: '编辑',
  2: '详谈',
  3: '重新委托团队',
  4: '放弃受理该案件',
  5: '删除案件',
  6: '受理案件',
  7: '审核案件',
  8: '完成案件',
};

export type CASES_BUTTONS_MAP_Value = (keyof typeof CASES_BUTTONS_MAP)[];

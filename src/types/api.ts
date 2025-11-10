// API响应模型
export interface ApifoxModel {
    code: number;
    cost_money: number;
    cut_words: string;
    data: Datum[];
    data_number: number;
    msg: string;
    page: number;
    remain_money: number;
    total: number;
    total_page: number;
    [property: string]: any;
}

// 单篇文章数据
export interface Datum {
    /**
     * 封面
     */
    avatar: string;
    /**
     * 分类
     */
    classify: string;
    /**
     * 正文
     */
    content: string;
    /**
     * 原始id
     */
    ghid: string;
    /**
     * 发布地址
     */
    ip_wording: string;
    /**
     * 是否原创
     */
    is_original: number;
    /**
     * 再看数
     */
    looking: number;
    /**
     * 点赞数
     */
    praise: number;
    /**
     * 发布时间
     */
    publish_time: number;
    publish_time_str: string;
    /**
     * 阅读数
     */
    read: number;
    /**
     * 文章原始短链接
     */
    short_link: string;
    /**
     * 文章标题
     */
    title: string;
    /**
     * 更新时间
     */
    update_time: number;
    update_time_str: string;
    /**
     * 文章长连接
     */
    url: string;
    /**
     * wxid
     */
    wx_id: string;
    /**
     * 公众号名字
     */
    wx_name: string;
    [property: string]: any;
}

// API请求参数
export interface ApiRequestParams {
    kw: string;
    sort_type: number;
    mode: number;
    period: number;
    page: number;
    key: string;
    any_kw: string;
    ex_kw: string;
    verifycode: string;
    type: number;
}

// 转换后的文章数据结构
export interface ArticleData {
    id: string;
    title: string;
    content: string;
    readCount: number;
    likeCount: number;
    viewCount: number;
    interactiveRate: number;
    summary: string;
    wxName: string;
    publishTime: string;
    url: string;
    avatar: string;
    classify: string;
    isOriginal: boolean;
}

// 词云数据
export interface WordCloudData {
    text: string;
    count: number;
}

// 分析报告数据
export interface AnalysisReport {
    wordCloud: WordCloudData[];
    insights: string[];
    topLikedArticles: ArticleData[];
    topInteractiveArticles: ArticleData[];
    articles: ArticleData[];
}
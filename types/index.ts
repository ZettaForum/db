// @ts-check

/// <reference types="ipfs" />

interface InitOptions {

    /** 站点名称 */
    name: string;

    /** 站点创建者的用户公钥 */
    creator: UserKey;

    /** 帖子数据库 (主数据库) 地址 */
    postsDBAddr: string;

    /** 用户活动地址 (计划中) */
    activitiesDBAddr?: string;

    /** 
     * 管理员  
     * 默认为 [InitOptions.creator] (站点创建者)
     */
    administrators?: string[];

    /** 
     * 使用的ipfs实例  
     * 需要设置 `EXPERIMENTAL: { pubsub: true }` 和 `start: false`
     */
    ipfs?: ipfs;

    /** 出错时的回调函数 */
    errCallback?: (err: Error) => any;

    /** 其它选项参数 (传递给 UI 和主题) */
    [key: string]: any;

}

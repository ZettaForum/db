// @ts-check

/// <reference path="../types/entry.ts" />

interface PostPayload {
    /** 发布时间，使用 ISO 8601 */
    date: string;

    /** 帖子标题 */
    title: string;

    /** 帖子内容 */
    content: string;

    /** 帖子分类 */
    category?: string;

    /** 帖子标签 */
    tags?: Tag[];

    /** 帖子评论数据库地址 */
    commentsDBAddr: CommentsDBAddr;

    /** 帖子和评论投票数据库地址 (计划中) */
    votesDBAddr?: VotesDBAddr;
}

interface PostADD {
    op: "ADD";
    value: PostPayload;
}

interface PostDEL {
    op: 'DEL';
    value: PostID;
}

interface PostEntry extends Entry {
    /** 帖子 ID */
    hash: PostID;

    /** 发布者的用户公钥 */
    key: UserKey;

    payload: PostADD;
}

interface PostObj extends PostPayload {
    /** 帖子 ID (PostEntry.hash) */
    id: PostID;

    /** 帖子发布者的用户公钥 (PostEntry.key) */
    author: UserKey;
}

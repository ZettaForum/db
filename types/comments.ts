// @ts-check

/// <reference path="../types/entry.ts" />

interface CommentPayload {
    /** 创建时间 */
    date: string;

    /** 父评论的ID */
    parent?: CommentID | null;

    /** 评论内容 */
    content: string;
}

interface CommentADD {
    op: "ADD";
    value: CommentPayload;
}

interface CommentDEL {
    op: 'DEL';
    value: CommentID;
}

interface CommentEntry extends Entry {
    /** 评论 ID */
    hash: CommentID;

    /** 作者的用户公钥 */
    key: UserKey;

    payload: CommentADD;
}

interface CommentObj extends CommentPayload {
    /** 评论 ID (CommentEntry.hash) */
    id: CommentID;

    /** 顺序 (基于 Lamport Clock) */
    order: number;

    children?: CommentObj[] | null;

    /** 作者的用户公钥 (CommentEntry.key) */
    author: UserKey;
}

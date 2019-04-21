// @ts-check

/// <reference path="../types/entry.ts" />

interface VotePayload {
    /** 投票时间 */
    date: string;

    /** 投票类型 (赞、踩) */
    type: "UP" | "DOWN";

    /** 投票对象类型 */
    targetType: "Comment" | "Post";

    /** 投票对象的评论 ID (如果投票对象为评论) */
    targetId?: CommentID | PostID;
}

interface VoteEntry extends Entry {
    /** 投票者的用户公钥 */
    key: UserKey;

    payload: {
        op: "ADD";
        value: VotePayload;
    };
}

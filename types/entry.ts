// @ts-check

/** 用户公钥 */
type UserKey = string;

/** 评论 ID */
type CommentID = string;

/** 帖子 ID */
type PostID = string;

/** 标签名称 */
type Tag = string;

/** 评论数据库地址 */
type CommentsDBAddr = string;

/** 投票数据库地址 */
type VotesDBAddr = string;

interface Entry {
    /** ID */
    hash: string;

    /** 用户公钥 */
    key: UserKey;

    /** Lamport Clock */
    clock: {
        time: number;
    }

    payload: {
        op: string;
        key?: string | null;
        value: Object;
    };
}

type OrbitDB = import("orbit-db").OrbitDB;

type ZettaStore<T extends Entry> = import("@zetta-projects/zettastore").ZettaStore<T>;

type EntryIterator<T extends Entry> = import("@zetta-projects/zettastore").EntryIterator<T>;

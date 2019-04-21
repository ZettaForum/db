// @ts-check

/// <reference path="../types/comments.ts" />

const { safeArray } = require("./util.js")
const DBUtils = require("./db-utils.js")

class Comments {

    /**
     * @protected
     * @param {ZettaStore<any>} db 帖子评论数据库实例 (已加载状态)
     * @param {DBUtils} dbutils DBUtils (db-utils.js) 实例
     */
    constructor(db, dbutils) {
        this.db = db
        this.dbutils = dbutils
    }

    /**
     * 获取所有评论 (线性排列)
     */
    getAllComments() {
        const entries = this.db.iterator({ limit: -1 }).collect().concat()
        const objs = entries.filter(entry => {
            return Comments._isValidCommentEntry(entry)
        }).map(entry => {
            return Comments._parseCommentEntry(entry)
        })
        return Comments._sort(objs)
    }

    /**
     * 获取所有评论 (树状排列)
     */
    getCommentsTree() {
        return Comments._toTree(this.getAllComments())
    }

    /**
     * 删除评论
     * @param {CommentID} commentID 评论ID
     */
    deleteComment(commentID) {
        // 检测是否可以删除
        if (!DBUtils.canDeleteEntry(this.db, commentID)) {
            return null
        }

        return this.db.remove(commentID)
    }

    /**
     * 添加评论
     * @param {string} content 评论内容
     * @param {CommentID} parent 父评论的评论ID
     * @returns {Promise<CommentID>} 评论ID
     */
    addComment(content, parent = null) {
        /** @type {CommentPayload} */
        const payload = {
            date: new Date().toISOString(),
            parent: parent || null,
            content
        }

        return this.db.add(payload)
    }

    /**
     * @param {CommentEntry} entry 
     */
    static _isValidCommentEntry(entry) {
        const payload = entry.payload.value
        const keys = [
            "date",
            "parent",
            "content",
        ]

        return keys.every(key => payload.hasOwnProperty(key))
            && (typeof payload.content === "string")
            && !isNaN(Date.parse(payload.date))
            && (payload.parent === null || typeof payload.parent === "string")
    }

    /**
     * 解析 CommentEntry
     * @param {CommentEntry} entry 
     * @returns {CommentObj}
     */
    static _parseCommentEntry(entry) {
        const commentID = entry.cid
        const payload = entry.payload.value
        const author = entry.key
        const order = entry.clock.time
        return Object.assign({ id: commentID, author, order }, payload)
    }

    /**
     * 升序排序 CommentObj[]
     * @param {CommentObj[]} array 
     */
    static _sort(array) {
        return array.sort((a, b) => {
            if (a.order == b.order) {
                return +new Date(a.date) - +new Date(b.date)
            } else {
                return a.order - b.order
            }
        })
    }

    /**
     * 树状排列
     * @param {CommentObj[]} objs 
     */
    static _toTree(objs) {
        const objsMap = new Map(
            objs.map((x) => {
                return [x.id, x]
            })
        )

        for (const obj of objs) {
            const parent = obj.parent && objsMap.get(obj.parent)
            if (parent) {
                if (!parent.children) {
                    parent.children = []
                }
                parent.children.push(obj)
            }
        }

        /** @type {CommentObj[]} */
        const objsTree = []
        objsMap.forEach((entry) => {
            const parent = entry.parent
            if (!parent || !objsMap.get(parent)) {
                entry.parent = null
                return objsTree.push(entry)
            }
        })

        const tree = Comments._sort(objsTree)
        return tree
    }

    /**
     * @param {OrbitDB} orbitdb OrbitDB 实例
     * @param {string} commentsDBAddr 帖子评论数据库地址
     * @param {UserKey} postAuthor 帖子发布者的用户公钥
     * @param {UserKey[]} admins 管理员们的用户公钥
     */
    static async createInstance(orbitdb, commentsDBAddr, postAuthor, admins) {
        const dbutils = new DBUtils(orbitdb)

        // 打开数据库
        const db = await dbutils.openDB(commentsDBAddr)
        await db.loadAndSync(postAuthor)
        db.setAdmins(safeArray(admins))

        return new Comments(db, dbutils)
    }

}

module.exports = Comments

// @ts-check
// 帖子数据库

/// <reference path="../types/posts.ts" />

const { safeArray } = require("./util.js")
const DBUtils = require("./db-utils.js")

class Posts {

    /**
     * @protected
     * @param {ZettaStore<any>} db 帖子数据库实例 (已加载状态)
     * @param {DBUtils} dbutils DBUtils (db-utils.js) 实例
     */
    constructor(db, dbutils) {
        this.db = db
        this.dbutils = dbutils
    }

    /**
     * 解析 PostEntry
     * @param {PostEntry} entry 
     * @returns {PostObj}
     */
    _parsePostEntry(entry) {
        const postid = entry.hash
        const payload = entry.payload.value
        const author = entry.key
        return Object.assign({ id: postid, author }, payload)
    }

    /**
     * @param {PostEntry} entry 
     */
    _isValidPostEntry(entry) {
        const payload = entry.payload.value
        const keys = [
            "date",
            "title",
            "content",
            "commentsDBAddr",
        ]

        return keys.every(key => payload.hasOwnProperty(key))
            && keys.every(key => typeof payload[key] === "string")
            && !isNaN(Date.parse(payload.date))
            && (payload.tags ? payload.tags.every(tag => typeof tag === "string") : true)
    }

    /**
     * @param {PostID} postid 
     */
    getPost(postid) {
        /** @type {PostEntry} */
        const entry = this.db.get(postid)

        if (!entry || !this._isValidPostEntry(entry)) {
            return null
        }

        return this._parsePostEntry(entry)
    }

    /**
     * @param {number} start 
     * @param {number} end 
     */
    getAllPosts(start = 0, end = Infinity) {
        const allEntries = this.db.iterator({ limit: -1, reverse: true }).collect()
        const entries = allEntries.slice(start, end)
        return entries.filter(entry => {
            return entry && this._isValidPostEntry(entry)
        }).map(entry => {
            return this._parsePostEntry(entry)
        })
    }

    /**
     * @param {string} title 帖子标题
     * @param {string} content 帖子内容
     * @param {string} category 帖子分类
     * @param {Tag[]} tags 帖子标签
     * @returns {Promise<PostID>} 帖子 ID
     */
    async newPost(title, content, category = "", tags = []) {
        /** @type {PostPayload} */
        const payload = {
            date: new Date().toISOString(),
            title,
            content,
            category,
            tags: safeArray(tags),
            commentsDBAddr: await this.dbutils.newCommentsDB(),
            votesDBAddr: await this.dbutils.newVotesDB(),
        }

        return this.db.add(payload)
    }

    /**
     * @param {PostID} postid 
     */
    async deletePost(postid) {
        // 检测是否可以删除
        if (!DBUtils.canDeleteEntry(this.db,postid)) {
            return null
        }

        return await this.db.remove(postid)
    }

    async destroy() {
        await this.db.close()
    }

    /**
     * @param {OrbitDB} orbitdb OrbitDB 实例
     * @param {string} postsDBAddr 帖子数据库 (主数据库) 地址
     * @param {UserKey} creator 站点创建者的用户公钥
     * @param {UserKey[]} admins 管理员们的用户公钥
     */
    static async createInstance(orbitdb, postsDBAddr, creator, admins) {
        const dbutils = new DBUtils(orbitdb)

        // 打开数据库
        const db = await dbutils.openDB(postsDBAddr)
        await db.loadAndSync(creator)
        db.setAdmins(safeArray(admins))

        return new Posts(db, dbutils)
    }

}

module.exports = Posts

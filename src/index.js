// @ts-check

/// <reference path="../types/index.ts" />
/// <reference path="../types/entry.ts" />

const IPFS = require("ipfs")
const { isDefined } = require("./util.js")
const DBUtils = require("./db-utils.js")
const Posts = require("./posts.js")
const Comments = require("./comments.js")

/** 默认ipfs实例 */
const defaultIPFS = new IPFS({
    EXPERIMENTAL: {
        pubsub: true,
        ipnsPubsub: true,
    },
    start: false,
})

/** 
 * 默认设置
 * @type {InitOptions}
 */
const defaultOptions = {
    name: "ZettaForum",
    creator: "",
    postsDBAddr: null,
    administrators: [],
    ipfs: null,
    errCallback: (e) => console.error(e),
}

class ZettaForumDB {

    /**
     * @protected
     * @param {OrbitDB} orbitdb OrbitDB 实例
     * @param {InitOptions} options 
     */
    constructor(orbitdb, options = defaultOptions) {
        if (!isDefined(orbitdb)) {
            throw new Error("OrbitDB is a required argument.")
        }

        // 应用默认设置
        options = Object.assign(defaultOptions, options)

        this.options = options
        this.orbitdb = orbitdb
    }

    get swarm() {
        if (this.options.ipfs) {
            return this.options.ipfs.swarm
        } else {
            return null
        }
    }

    static get DBUtils() {
        return DBUtils
    }

    static get Posts() {
        return Posts
    }

    static get Comments() {
        return Comments
    }

    async InitDB() {
        const orbitdb = this.orbitdb
        const { postsDBAddr, creator, administrators } = this.options

        const posts = await Posts.createInstance(orbitdb, postsDBAddr, creator, administrators)
        this.posts = posts
    }

    /**
     * @param {PostID} postid 帖子ID
     */
    _getCommentsInstance(postid) {
        const postObj = this.posts.getPost(postid)
        if (!postObj) {
            throw new Error("Post Not Found")
        }

        const orbitdb = this.orbitdb
        const { administrators } = this.options
        const { author, commentsDBAddr } = postObj

        return Comments.createInstance(orbitdb, commentsDBAddr, author, administrators)
    }

    get comments() {
        const _this = this
        return {

            /**
             * 获取帖子的所有评论 (线性排列)
             * @param {PostID} postid 帖子ID
             */
            async getAllComments(postid) {
                const c = await _this._getCommentsInstance(postid)
                return c.getAllComments()
            },

            /**
             * 获取帖子的所有评论 (树状排列)
             * @param {PostID} postid 帖子ID
             */
            async getCommentsTree(postid) {
                const c = await _this._getCommentsInstance(postid)
                return c.getCommentsTree()
            },

            /**
             * 添加评论
             * @param {PostID} postid 帖子ID
             * @param {string} content 评论内容
             * @param {CommentID} parent 父评论的评论ID
             * @returns {Promise<CommentID>} 评论ID
             */
            async addComment(postid, content, parent = null) {
                const c = await _this._getCommentsInstance(postid)
                return c.addComment(content, parent)
            },

            /**
             * 删除评论
             * @param {PostID} postid 帖子ID
             * @param {CommentID} commentID 评论ID
             */
            async deleteComment(postid, commentID) {
                const c = await _this._getCommentsInstance(postid)
                return c.deleteComment(commentID)
            }

        }
    }

    /**
     * 创建新站点
     * @param {string} name 站点名称
     * @param {ipfs} ipfs IPFS 实例
     * @param {OrbitDB} orbitdb OrbitDB 实例
     * @returns {Promise<InitOptions>}
     */
    static async createSite(name, ipfs = defaultIPFS, orbitdb = null) {
        if (!orbitdb && ipfs) {
            orbitdb = await DBUtils.InitOrbitDB(ipfs)
        }

        const dbutils = new DBUtils(orbitdb)

        // @ts-ignore
        const key = orbitdb.identity.publicKey
        const postsDBAddr = await dbutils.newPostsDB()
        const activitiesDBAddr = await dbutils.newActivitiesDB()

        return {
            name,
            creator: key,
            postsDBAddr,
            activitiesDBAddr,
            administrators: [key],
        }
    }

    /**
     * @param {InitOptions} options 
     */
    static async createInstance(options = defaultOptions) {
        const ipfs = options.ipfs || defaultIPFS
        options.ipfs = ipfs

        // 创建 OrbitDB 实例
        const errCallback = (options && options.errCallback) || defaultOptions.errCallback
        const orbitdb = await DBUtils.InitOrbitDB(ipfs, errCallback)

        const zettaForumDB = new ZettaForumDB(orbitdb, options)
        await zettaForumDB.InitDB()

        return zettaForumDB
    }

}

module.exports = ZettaForumDB

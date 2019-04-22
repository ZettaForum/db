// @ts-check

/// <reference path="../types/entry.ts" />
/// <reference types="ipfs" />

/** @type { (addr: string) => boolean } */
// @ts-ignore
const isValidAddress = require("orbit-db").isValidAddress

const { getRandomData, toHex } = require("./util.js")

/** @type {typeof import("orbit-db").default} */
// @ts-ignore
const OrbitDB = require("orbit-db")

/** 创建数据库时的选项 */
const dbOptions = {
    accessController: {
        // type: 'orbitdb',
        write: [
            "*"
        ]
    }
}

class DBUtils {

    /**
     * @param {OrbitDB} orbitdb OrbitDB 实例
     * @param {IStoreOptions} options 创建数据库时的选项
     */
    constructor(orbitdb, options = dbOptions) {
        this.orbitdb = orbitdb
        this.options = options
    }

    /**
     * @param {string} dbName 
     */
    _createZettaStore(dbName) {
        return DBUtils.createZettaStore(this.orbitdb, dbName, this.options)
    }

    /**
     * @param {string} dbName 
     */
    async _newDB(dbName) {
        const db = await this._createZettaStore(dbName)
        await db.load()

        await db.init()

        const address = db.address.toString()
        return address
    }

    /**
     * @param {string} type 
     */
    _newZettaForumDB(type) {
        const randdata = toHex(getRandomData(16))
        const dbName = `zettaforum-${type}-${randdata}`
        return this._newDB(dbName)
    }

    newCommentsDB() {
        return this._newZettaForumDB("comments")
    }

    newVotesDB() {
        return this._newZettaForumDB("votes")
    }

    newPostsDB() {
        return this._newZettaForumDB("posts")
    }

    newActivitiesDB() {
        return this._newZettaForumDB("activities")
    }

    /**
     * 判断提供的数据库地址是否指向一个合法的 ZettaForum 数据库
     * @param {string} addr 
     * @returns {Promise<boolean>}
     */
    async isValidDB(addr) {

        if (isValidAddress(addr)) {
            try {
                const db = await this.orbitdb.open(addr, { type: "zetta" })
                await db.close()

                /** @type {string[]} */
                // @ts-ignore
                const writeAccess = db.access._write
                return writeAccess && writeAccess.includes("*")
            } catch (err) {
                console.error(err)
                return false
            }
        }

        return false
    }

    /**
     * 打开数据库
     * @param {string} addr 数据库地址
     * @returns {Promise<ZettaStore<any>>}
     */
    openDB(addr) {
        // @ts-ignore
        return this.orbitdb.open(addr, { type: "zetta", create: false })
    }

    /**
     * 检测是否可以删除给定的 entry
     * @param {ZettaStore<any>} db 
     * @param {string} hash 
     * @returns {boolean}
     */
    static canDeleteEntry(db, hash) {
        // @ts-ignore
        if (db._index && typeof db._index.canDelete == "function") {
            // @ts-ignore
            return db._index.canDelete(hash)
        } else {
            return null
        }
    }

    /**
     * @param {OrbitDB} orbitdb OrbitDB 实例
     * @param {string} dbName 
     * @param {IStoreOptions} options 
     * @returns {Promise<ZettaStore<any>>}
     */
    static createZettaStore(orbitdb, dbName, options) {
        // @ts-ignore
        return orbitdb.create(dbName, "zetta", options)
    }

    /**
     * 创建 OrbitDB 实例
     * @param {ipfs} ipfs IPFS 实例
     * @param { (err: Error) => any } errCallback
     */
    static async InitOrbitDB(ipfs, errCallback = (e) => console.error(e)) {
        // 注册自定义 OrbitDB Store
        DBUtils.registerZettaStore()

        // 绑定 errCallback
        ipfs.on("error", errCallback)

        if (!ipfs.isOnline()) {
            // 等待ipfs初始化完成
            await new Promise((resolve) => {
                ipfs.on("ready", async () => {
                    await ipfs.start()
                    resolve()
                })
            })
        }

        // 创建 OrbitDB 实例
        const orbitdb = await OrbitDB.createInstance(ipfs)
        return orbitdb
    }

    static registerZettaStore() {
        /** @type {import("@zetta-projects/zettastore").ZettaStore<any>} */
        // @ts-ignore
        const ZettaStore = require("@zetta-projects/zettastore")
        if (!OrbitDB.databaseTypes.includes(ZettaStore.type)) {
            OrbitDB.addDatabaseType(ZettaStore.type, ZettaStore)
        }
    }

}

module.exports = DBUtils

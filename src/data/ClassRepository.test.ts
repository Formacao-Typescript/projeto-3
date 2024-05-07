import assert from 'node:assert';
import { afterEach, before, describe, it } from 'node:test';
import { ClassRepository } from './ClassRepository.js'
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Class } from '../domain/Class.js'
import { unlinkIfExists } from '../utils/unlinkIfExists.js'

describe('ClassRepository', () => {
    const DB_PATH = resolve(dirname(fileURLToPath(import.meta.url)), '.data')
    const DB_FILE_NAME = 'class-test.json'
    const classEntity = new Class({
        code: '1B-M',
        teacher: null
    })

    before(() => {
        unlinkIfExists(resolve(DB_PATH), DB_FILE_NAME)
    })

    afterEach(() => {
        unlinkIfExists(resolve(DB_PATH), DB_FILE_NAME)
    })

    it('should create a new json file under .data', () => {
        void new ClassRepository()
        const dirs = readdirSync(DB_PATH)
        assert.ok(dirs.includes(DB_FILE_NAME))
    })

    it('should save a new entity in the database', () => {
        const db = new ClassRepository()
        const instance = db.save(classEntity)
        const list = JSON.parse(readFileSync(`${DB_PATH}/${DB_FILE_NAME}`, 'utf-8'))
        assert.deepStrictEqual(Class.fromObject(list[0][1]), classEntity)
    })

    it('should list all entities in the database', () => {
        const db = new ClassRepository()
        db.save(classEntity)
        const list = db.list()
        assert.ok(list.length === 1)
        assert.ok(list[0] instanceof Class)
    })

    it('should find an entity by id', () => {
        const db = new ClassRepository()
        db.save(classEntity)
        const entity = db.findById(classEntity.id)
        assert.ok(entity instanceof Class)
        assert.deepStrictEqual(entity, classEntity)
    })

    it('should update an entity in the database', () => {
        const db = new ClassRepository()
        const newClass = new Class({
            code: '1B-M',
            teacher: null
        })
        db.save(newClass)

        newClass.code = '2C-T'
        const updated = db.save(newClass
        ).findById(newClass.id)
        assert.ok(updated instanceof Class)
        assert.deepStrictEqual(updated, newClass)
    })

    it('should find an entity by an specific property', () => {
        const db = new ClassRepository()
        db.save(classEntity)
        const list = db.listBy('code', classEntity.code)
        assert.ok(list.length === 1)
        assert.ok(list[0] instanceof Class)
        assert.deepStrictEqual(list[0], classEntity)
    })

    it('should delete an entity from the database', () => {
        const db = new ClassRepository()
        db.save(classEntity)
        const list = db.list()
        assert.ok(list.length === 1)
        db.remove(classEntity.id)
        assert.ok(db.list().length === 0)
    })
})
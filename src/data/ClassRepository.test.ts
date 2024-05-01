import assert from 'node:assert'
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { after, before, describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'
import { Class } from '../domain/Class.js'
import { unlinkIfExists } from '../utils/unlinkIfExists.js'
import { ClassRepository } from './ClassRepository.js'

describe('ClassRepository', () => {
  const DB_PATH = resolve(dirname(fileURLToPath(import.meta.url)), '.data')
  const DB_FILE_NAME = 'class-test.json'
  const classEntity = new Class({
    code: '1B-M',
    teacher: null
  })

  before(() => {
    // limpa o arquivo de teste antes de começar
    // isso garante que sempre vamos ter um único registro
    unlinkIfExists(resolve(DB_PATH), DB_FILE_NAME)
  })

  // Depois de cada teste, limpa o arquivo de teste
  after(() => {
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
    assert.ok(instance instanceof ClassRepository)
    const list = JSON.parse(readFileSync(`${DB_PATH}/${DB_FILE_NAME}`, 'utf-8'))
    assert.deepStrictEqual(Class.fromObject(list[0][1]), classEntity)
  })

  it('should list all entities in the database', () => {
    const db = new ClassRepository()
    const list = db.list() as Class[]
    assert.ok(list.length === 1)
    assert.ok(list[0] instanceof Class)
  })

  it('should find the entity by id', () => {
    const db = new ClassRepository()
    const found = db.findById(classEntity.id)
    assert.ok(found instanceof Class)
    assert.deepStrictEqual(found, classEntity)
  })

  it('should update the entity', () => {
    const db = new ClassRepository()
    classEntity.code = '2C-T'
    const updated = db.save(classEntity).findById(classEntity.id)
    assert.ok(updated instanceof Class)
    assert.deepStrictEqual(updated, classEntity)
  })

  it('should list by a specific property', () => {
    const db = new ClassRepository()
    const list = db.listBy('code', classEntity.code) as Class[]
    assert.ok(list.length === 1)
    assert.ok(list[0] instanceof Class)
    assert.deepStrictEqual(list[0], classEntity)
  })

  it('should remove from the database', () => {
    const db = new ClassRepository()
    db.remove(classEntity.id)
    assert.ok(db.list().length === 0)
  })
})

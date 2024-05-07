import assert from 'node:assert'
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { afterEach, before, describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'
import { Parent } from '../domain/Parent.js'
import { unlinkIfExists } from '../utils/unlinkIfExists.js'
import { ParentRepository } from './ParentRepository.js'

describe('ParentRepository', () => {
  const DB_PATH = resolve(dirname(fileURLToPath(import.meta.url)), '.data')
  const DB_FILE_NAME = 'parent-test.json'
  const parent = new Parent({
    firstName: 'Lucas',
    surname: 'Santos',
    phones: ['123456789'],
    emails: ['foo@gmail.com'],
    document: '123456789',
    address: [{ city: 'Foo', country: 'Bar', line1: 'Baz', zipCode: '123456', line2: 'FooBar' }]
  })

  before(() => {
    // limpa o arquivo de teste antes de começar
    // isso garante que sempre vamos ter um único registro
    unlinkIfExists(resolve(DB_PATH), DB_FILE_NAME)
  })

  // Depois de cada teste, limpa o arquivo de teste
  afterEach(() => {
    unlinkIfExists(resolve(DB_PATH), DB_FILE_NAME)
  })

  it('should create a new json file under .data', () => {
    void new ParentRepository()
    const dirs = readdirSync(DB_PATH)
    assert.ok(dirs.includes(DB_FILE_NAME))
  })

  it('should save new entity in the database', () => {
    const db = new ParentRepository()
    const instance = db.save(parent)
    assert.ok(instance instanceof ParentRepository)
    const list = JSON.parse(readFileSync(`${DB_PATH}/parent-test.json`, 'utf-8'))
    assert.deepStrictEqual(Parent.fromObject(list[0][1]), parent)
  })

  it('should list all entities in the database', () => {
    const db = new ParentRepository()
    const list = db.save(parent).list() as Parent[]
    assert.ok(list.length === 1)
    assert.ok(list[0] instanceof Parent)
  })

  it('should find by id', () => {
    const db = new ParentRepository()
    const found = db.save(parent).findById(parent.id)
    assert.ok(found instanceof Parent)
    assert.deepStrictEqual(found, parent)
  })

  it('should update', () => {
    const db = new ParentRepository()
    const newParent = new Parent({
      firstName: 'Lucas',
      surname: 'Santos',
      phones: ['123456789'],
      emails: ['foo@gmail.com'],
      document: '123456789',
      address: [{ city: 'Foo', country: 'Bar', line1: 'Baz', zipCode: '123456', line2: 'FooBar' }]
    })
    db.save(newParent)
    newParent.firstName = 'Not Lucas'
    const updated = db.save(newParent).findById(newParent.id)
    assert.ok(updated instanceof Parent)
    assert.deepStrictEqual(updated, newParent)
  })

  it('should list by a specific property', () => {
    const db = new ParentRepository()
    const list = db.save(parent).listBy('surname', 'Santos') as Parent[]
    assert.ok(list.length === 1)
    assert.ok(list[0] instanceof Parent)
    assert.deepStrictEqual(list[0], parent)
  })

  it('should remove from the database', () => {
    const db = new ParentRepository()
    db.save(parent)
    assert.ok(db.list().length === 1)
    db.remove(parent.id)
    assert.ok(db.list().length === 0)
  })
})

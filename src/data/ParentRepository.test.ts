import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
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

  beforeAll(() => {
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
    expect(dirs).toContain(DB_FILE_NAME)
  })

  it('should save new entity in the database', () => {
    const db = new ParentRepository()
    const instance = db.save(parent)
    expect(instance).toBeInstanceOf(ParentRepository)
    const list = JSON.parse(readFileSync(`${DB_PATH}/parent-test.json`, 'utf-8'))
    expect(Parent.fromObject(list[0][1])).toStrictEqual(parent)
  })

  it('should list all entities in the database', () => {
    const db = new ParentRepository()
    const list = db.save(parent).list() as Parent[]
    expect(list.length).toBe(1)
    expect(list[0]).toBeInstanceOf(Parent)
  })

  it('should find by id', () => {
    const db = new ParentRepository()
    const found = db.save(parent).findById(parent.id)
    expect(found).toBeInstanceOf(Parent)
    expect(found).toStrictEqual(parent)
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
    expect(updated).toBeInstanceOf(Parent)
    expect(updated).toStrictEqual(newParent)
  })

  it('should list by a specific property', () => {
    const db = new ParentRepository()
    const list = db.save(parent).listBy('surname', 'Santos') as Parent[]
    expect(list.length).toBe(1)
    expect(list[0]).toBeInstanceOf(Parent)
    expect(list[0]).toStrictEqual(parent)
  })

  it('should remove from the database', () => {
    const db = new ParentRepository()
    db.save(parent)
    expect(db.list().length).toBe(1)
    db.remove(parent.id)
    expect(db.list().length).toBe(0)
  })
})

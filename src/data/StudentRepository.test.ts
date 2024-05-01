import assert from 'node:assert'
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { after, before, describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'
import { Student } from '../domain/Student.js'
import { unlinkIfExists } from '../utils/unlinkIfExists.js'
import { StudentRepository } from './StudentRepository.js'
import { randomUUID } from 'node:crypto'

describe('StudentRepository', () => {
  const DB_PATH = resolve(dirname(fileURLToPath(import.meta.url)), '.data')
  const DB_FILE_NAME = 'student-test.json'
  const teacher = new Student({
    firstName: 'Lucas',
    surname: 'Santos',
    birthDate: new Date('1995-01-01').toISOString(),
    bloodType: 'A+',
    class: randomUUID(),
    document: '123456789',
    parents: [randomUUID()],
    startDate: new Date('2010-10-10').toISOString()
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
    void new StudentRepository()
    const dirs = readdirSync(DB_PATH)
    assert.ok(dirs.includes(DB_FILE_NAME))
  })

  it('should save a new entity in the database', () => {
    const db = new StudentRepository()

    const instance = db.save(teacher)
    assert.ok(instance instanceof StudentRepository)
    const file = JSON.parse(readFileSync(`${DB_PATH}/${DB_FILE_NAME}`, 'utf-8'))
    assert.deepStrictEqual(Student.fromObject(file[0][1]), teacher)
  })

  it('should list all entities in the database', () => {
    const db = new StudentRepository()
    const list = db.list() as Student[]
    assert.ok(list.length === 1)
    assert.ok(list[0] instanceof Student)
  })

  it('should find by id', () => {
    const db = new StudentRepository()
    const found = db.findById(teacher.id)
    assert.ok(found instanceof Student)
    assert.deepStrictEqual(found, teacher)
  })

  it('should update', () => {
    const db = new StudentRepository()
    teacher.firstName = 'Not Lucas'
    const updated = db.save(teacher).findById(teacher.id)
    assert.ok(updated instanceof Student)
    assert.deepStrictEqual(updated, teacher)
  })

  it('should list by a specific property', () => {
    const db = new StudentRepository()
    const list = db.listBy('surname', 'Santos') as Student[]
    assert.ok(list.length === 1)
    assert.ok(list[0] instanceof Student)
    assert.deepStrictEqual(list[0], teacher)
  })

  it('should remove from the database', () => {
    const db = new StudentRepository()
    db.remove(teacher.id)
    const list = db.list() as Student[]
    assert.ok(list.length === 0)
  })
})

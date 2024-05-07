import assert from 'node:assert'
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { afterEach, before, describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'
import { Teacher } from '../domain/Teacher.js'
import { unlinkIfExists } from '../utils/unlinkIfExists.js'
import { TeacherRepository } from './TeacherRepository.js'

describe('TeacherRepository', () => {
  const DB_PATH = resolve(dirname(fileURLToPath(import.meta.url)), '.data')
  const DB_FILE_NAME = 'teacher-test.json'
  const teacher = new Teacher({
    firstName: 'Lucas',
    surname: 'Santos',
    phone: '123456789',
    email: 'foo@gmail.com',
    document: '123456789',
    hiringDate: new Date('2020-10-20').toISOString(),
    major: 'Computer Science',
    salary: 5000
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
    void new TeacherRepository()
    const dirs = readdirSync(DB_PATH)
    assert.ok(dirs.includes(DB_FILE_NAME))
  })

  it('should save a new entity in the database', () => {
    const db = new TeacherRepository()

    const instance = db.save(teacher)
    assert.ok(instance instanceof TeacherRepository)
    const file = JSON.parse(readFileSync(`${DB_PATH}/${DB_FILE_NAME}`, 'utf-8'))
    assert.deepStrictEqual(Teacher.fromObject(file[0][1]), teacher)
  })

  it('should list all entities in the database', () => {
    const db = new TeacherRepository()
    const list = db.save(teacher).list() as Teacher[]
    assert.ok(list.length === 1)
    assert.ok(list[0] instanceof Teacher)
  })

  it('should find by id', () => {
    const db = new TeacherRepository()
    const found = db.save(teacher).findById(teacher.id)
    assert.ok(found instanceof Teacher)
    assert.deepStrictEqual(found, teacher)
  })

  it('should update', () => {
    const db = new TeacherRepository()
    const newTeacher = new Teacher({
      firstName: 'Lucas',
      surname: 'Santos',
      phone: '123456789',
      email: 'foo@gmail.com',
      document: '123456789',
      hiringDate: new Date('2020-10-20').toISOString(),
      major: 'Computer Science',
      salary: 5000
    })
    newTeacher.firstName = 'Not Lucas'
    const updated = db.save(newTeacher).findById(newTeacher.id)
    assert.ok(updated instanceof Teacher)
    assert.deepStrictEqual(updated, newTeacher)
  })

  it('should list by a specific property', () => {
    const db = new TeacherRepository()
    const list = db.save(teacher).listBy('surname', 'Santos') as Teacher[]
    assert.ok(list.length === 1)
    assert.ok(list[0] instanceof Teacher)
    assert.deepStrictEqual(list[0], teacher)
  })

  it('should remove from the database', () => {
    const db = new TeacherRepository()
    db.save(teacher)
    assert.ok(db.list().length === 1)
    db.remove(teacher.id)
    const list = db.list() as Teacher[]
    assert.ok(list.length === 0)
  })
})

import bookshelf from 'bookshelf'
import knex from 'knex'
import Promise from 'bluebird'
import upsert from 'bookshelf-upsert'
import { labelSystemConfig, semmedDBConfig } from './config.js'

const labelSystemKnex = knex(labelSystemConfig);
const labelSystemBookshelf = bookshelf(labelSystemKnex);
labelSystemBookshelf.plugin(upsert);

const Correctness = labelSystemBookshelf.model('Correctness', {
    tableName: 'CORRECTNESS',
    idAttribute: 'PMID'
});

const semmedDBKnex = knex(semmedDBConfig);
const semmedDBBookshelf = bookshelf(semmedDBKnex);

const Sentence = semmedDBBookshelf.model('Sentence', {
    tableName: 'SENTENCE'
});

const Predication = semmedDBBookshelf.model('Predication', {
    tableName: 'PREDICATION',
    sentence() {
        return this.hasOne(Sentence, 'SENTENCE_ID', 'SENTENCE_ID')
    },
    label() {
        return this.hasOne(Correctness, 'PMID', 'PMID');
    }
});

// new Predication().where('PREDICATION_ID', 'IN', ['10592604', '10592697']).fetchAll({withRelated: ['sentence', 'label']})
// .then((model) => {
//     const result = model.toJSON().map(({ PMID, PREDICATE, sentence: { SENTENCE }, label: { LABEL = null } = {} }) => ({
//         PMID,
//         PREDICATE,
//         SENTENCE,
//         LABEL
//     }));
//     console.log(result);
// });

const jsonData = [{ PMID: '16530475', LABEL: 1 }, { PMID: '16530470', LABEL: null }];
labelSystemBookshelf.transaction(function(t) {
    return Promise.map(jsonData, function(item) {
        return new Correctness({ PMID: item.PMID }).upsert({
            LABEL: item.LABEL
        }, {
            transacting: t
        });

    });
})
.then(() => { console.log('save!'); })
.catch((error) => { console.log(error); });
import 'dotenv/config';
import { EJSON, MongoClient } from 'mongodb';

const uri = process.env.MONGO_URI;
const sourceName = process.env.MONGO_SOURCE_DB || 'forgekey';
const targetName = process.env.MONGO_TARGET_DB || 'forgeqa';
const applyChanges = process.argv.includes('--apply');
const batchSize = 250;

if (!uri) {
  throw new Error('Set MONGO_URI privately in the environment or License Manager .env file.');
}
if (sourceName === targetName) {
  throw new Error('MONGO_SOURCE_DB and MONGO_TARGET_DB must be different databases.');
}
if (
  ['admin', 'config', 'local'].includes(sourceName) ||
  ['admin', 'config', 'local'].includes(targetName)
) {
  throw new Error('System databases cannot be used as migration source or target.');
}

const client = new MongoClient(uri, { serverSelectionTimeoutMS: 10000 });

function conflictId(collectionName, id) {
  return `${sourceName}:${collectionName}:${EJSON.stringify(id)}`;
}

async function archiveConflict(target, collectionName, document, reason) {
  const id = conflictId(collectionName, document._id);
  await target.collection(`merge_conflicts_${sourceName}`).updateOne(
    { _id: id },
    {
      $setOnInsert: {
        sourceDatabase: sourceName,
        targetDatabase: targetName,
        sourceCollection: collectionName,
        sourceDocument: document,
        reason,
        archivedAt: new Date().toISOString(),
      },
    },
    { upsert: true }
  );
}

async function migrateCollection(source, target, collectionName) {
  const sourceCollection = source.collection(collectionName);
  const targetCollection = target.collection(collectionName);
  const sourceCount = await sourceCollection.countDocuments();
  const targetCount = await targetCollection.countDocuments();
  let copied = 0;
  let alreadyPresent = 0;
  let conflicts = 0;
  let batch = [];

  async function flushBatch() {
    for (const document of batch) {
      if (!applyChanges) {
        const existing = await targetCollection.findOne({ _id: document._id });
        if (!existing) copied++;
        else if (EJSON.stringify(existing) === EJSON.stringify(document)) alreadyPresent++;
        else conflicts++;
        continue;
      }

      try {
        const existing = await targetCollection.findOne({ _id: document._id });
        if (existing) {
          if (EJSON.stringify(existing) === EJSON.stringify(document)) {
            alreadyPresent++;
          } else {
            await archiveConflict(target, collectionName, document, 'duplicate_document_id');
            conflicts++;
          }
          continue;
        }
        await targetCollection.insertOne(document);
        copied++;
      } catch (error) {
        if (error.code !== 11000) throw error;
        await archiveConflict(target, collectionName, document, 'duplicate_unique_value');
        conflicts++;
      }
    }
    batch = [];
  }

  for await (const document of sourceCollection.find({}).batchSize(batchSize)) {
    batch.push(document);
    if (batch.length >= batchSize) await flushBatch();
  }
  await flushBatch();

  return {
    collection: collectionName,
    sourceCount,
    targetCount,
    copied,
    alreadyPresent,
    conflicts,
  };
}

try {
  await client.connect();
  const source = client.db(sourceName);
  const target = client.db(targetName);
  const collections = await source.listCollections({}, { nameOnly: true }).toArray();
  const results = [];

  for (const { name } of collections) {
    if (name.startsWith('system.')) continue;
    results.push(await migrateCollection(source, target, name));
  }

  console.log(
    JSON.stringify(
      {
        mode: applyChanges ? 'applied' : 'dry-run',
        sourceDatabase: sourceName,
        targetDatabase: targetName,
        sourcePreserved: true,
        dryRunNote: applyChanges
          ? undefined
          : 'Dry-run conflicts count duplicate _id values; unique-index conflicts are archived during apply.',
        results,
        totals: results.reduce(
          (total, result) => ({
            collections: total.collections + 1,
            copied: total.copied + result.copied,
            alreadyPresent: total.alreadyPresent + result.alreadyPresent,
            conflicts: total.conflicts + result.conflicts,
          }),
          { collections: 0, copied: 0, alreadyPresent: 0, conflicts: 0 }
        ),
      },
      null,
      2
    )
  );

  if (!applyChanges) {
    console.log('Dry run only. Review the result, then rerun with -- --apply to copy records.');
  }
} finally {
  await client.close();
}

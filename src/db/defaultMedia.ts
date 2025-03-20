import path from 'path';
import fs from 'fs/promises';
import { DefaultPromoModel } from '../models/defaultPromo';
import {
  DefaultCommercialModel,
  DefaultCommercial,
} from '../models/defaultCommercial';
import { Config } from '../models/config';
import * as dataTrans from '../services/dataTransformer';
import { MediaType } from '../models/enum/mediaTypes';
import { keyNormalizer } from '../utils/utilities';
import { checkBufferViability } from './utils';

export async function createDefaultPromo(config: Config): Promise<void> {
  const resolvedPromoPath = path.resolve(
    __dirname,
    '../../',
    config.defaultPromo,
  );
  const defaultPromo = await DefaultPromoModel.findOne({
    mediaItemId: 'default',
  });
  if (defaultPromo) {
    console.log('Default Promo already exists');
    return;
  }
  console.log('Creating Default Promo');
  console.log('Default Promo Path: ' + resolvedPromoPath);

  let duration = await dataTrans.getMediaDuration(resolvedPromoPath);

  const promo = new DefaultPromoModel({
    Title: 'Default',
    LoadTitle: 'default',
    Duration: duration,
    Path: resolvedPromoPath,
    Type: MediaType.Promo,
    Tags: ['default'],
  });
  await promo.save();
}

export async function createDefaultCommercials(config: Config): Promise<void> {
  const resolvedCommercialFolder = path.resolve(
    __dirname,
    '../../',
    config.defaultCommercialFolder,
  );
  const defaultCommercials = await DefaultCommercialModel.find({
    tags: 'default',
  });
  let commercialList: DefaultCommercial[] = [];
  for (let i = 0; i < defaultCommercials.length; i++) {
    commercialList.push(
      DefaultCommercial.fromMongoObject(defaultCommercials[i]),
    );
  }
  if (defaultCommercials.length > 0) {
    if (checkBufferViability(commercialList)) {
      console.log('Default Commercials already exist');
    } else {
      console.log('Default Commercials from DB are not viable');
      throw new Error('Default Commercials from DB are not viable');
    }
    return;
  }

  console.log(
    'Default Commercials do not exist in the database, creating them',
  );
  console.log('Default Commercial Folder: ' + resolvedCommercialFolder);

  try {
    const files = await fs.readdir(resolvedCommercialFolder);
    console.log('Files in Default Commercial Folder: ', files);

    for (let file of files) {
      if (
        !file.endsWith('.mp4') &&
        !file.endsWith('.mov') &&
        !file.endsWith('.avi')
      ) {
        continue;
      }
      let path = `${resolvedCommercialFolder}/${file}`;
      let duration = await dataTrans.getMediaDuration(path);
      let commercialName = file.replace(/\.[^/.]+$/, '');

      commercialList.push(
        new DefaultCommercial(
          commercialName,
          keyNormalizer(commercialName),
          duration,
          path,
          MediaType.Commercial,
          ['default'],
        ),
      );
    }

    if (checkBufferViability(commercialList)) {
      for (let commercial of commercialList) {
        const newCommercial = new DefaultCommercialModel({
          Title: commercial.title,
          LoadTitle: commercial.mediaItemId,
          Duration: commercial.duration,
          Path: commercial.path,
          Type: commercial.type,
          Tags: commercial.tags,
        });
        await newCommercial.save();
      }
      console.log('Default Commercials Created');
    } else {
      console.log(
        'Default Commercials from Default Commercial Folder are not viable',
      );
      throw new Error(
        'Default Commercials from Default Commercial Folder are not viable',
      );
    }
  } catch (err) {
    console.error('Error processing commercials:', err);
  }
}

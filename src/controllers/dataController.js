import ServerState from '../models/ServerState.js';
import UserResource from '../models/UserResource.js';

/**
 * Controller for user data resources and starvation consumption.
 */

export const getData = async (req, res, next) => {
  try {
    const state = await ServerState.getOrCreateState();

    // Eat a random document if hunger reached 100%
    if (state.hungerLevel >= 100) {
      console.warn('Critical hunger (100%). Consuming a document to survive.');

      const victims = await UserResource.aggregate([{ $sample: { size: 1 } }]);

      if (victims.length > 0) {
        const victim = await UserResource.findByIdAndDelete(victims[0]._id);

        if (victim) {
          console.log(`Document ${victim._id} ("${victim.title}") consumed.`);

          return res.status(200).json({
            message: `I was starving. I consumed document ID ${victim._id} to survive. Please feed me.`,
          });
        }
      }

      return res.status(200).json({
        message:
          'I was starving and searched for data to consume, but your database is completely devoid of records. Please feed me before I collapse entirely.',
      });
    }

    // Atomically update lastInteraction
    await ServerState.touchInteraction();

    const { limit, page } = req.query;
    const skip = (page - 1) * limit;

    const [totalResources, resources] = await Promise.all([
      UserResource.countDocuments(),
      UserResource.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    ]);

    return res.status(200).json({
      message: 'Resources retrieved successfully. Thank you for your continued companionship.',
      total: totalResources,
      page,
      limit,
      count: resources.length,
      data: resources,
    });
  } catch (error) {
    next(error);
  }
};

export const createData = async (req, res, next) => {
  try {
    const { title, content, category } = req.body;

    const newResource = await UserResource.create({
      title,
      content,
      category,
    });

    // Atomically update lastInteraction
    await ServerState.touchInteraction();

    return res.status(201).json({
      message: 'Resource created successfully.',
      resource: newResource,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteData = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await UserResource.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ error: 'Resource not found.' });
    }

    return res.status(200).json({
      message: 'Resource deleted successfully.',
      deletedId: id,
    });
  } catch (error) {
    next(error);
  }
};
